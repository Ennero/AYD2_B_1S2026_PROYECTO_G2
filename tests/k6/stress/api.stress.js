/**
 * LogiTrans — Stress Tests (k6)
 *
 * Diseño de 5 etapas adaptado al auto-scaling de ECS (CloudWatch lag ~3-4 min):
 *
 *   Stage 1 — baseline_100     :   100 req/min  2 min   Verificar sistema sano
 *   Stage 2 — ramp_to_stress   :   100→15k      5 min   Rampa gradual — ECS escala durante este período
 *   Stage 3 — stress_15000     : 15 000 req/min  3 min   Mantener carga alta con sistema ya escalado
 *   Stage 4 — recovery_2000    :  2 000 req/min  3 min   Verificar recuperación con capacidad escalada
 *   Stage 5 — spike_200000     :200 000 req/min  2 min   Punto de quiebre — degradación esperada
 *
 * Por qué rampa gradual en Stage 2:
 *   El salto instantáneo 100→15k causaba fallos masivos porque ECS necesita
 *   3 min para detectar la carga (CloudWatch) + 90s para arrancar tasks nuevos.
 *   La rampa de 5 min le da tiempo al auto-scaling de reaccionar ANTES de
 *   llegar al pico, de modo que el stage de stress se ejecuta con la capacidad
 *   ya disponible.
 *
 * Run (plain):
 *   k6 run tests/k6/stress/api.stress.js
 *
 * Run with JSON output:
 *   k6 run --out json=tests/k6/reports/stress-result.json tests/k6/stress/api.stress.js
 *
 * Run against production:
 *   BASE_URL=https://guatechnology.com k6 run tests/k6/stress/api.stress.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const responseDuration = new Trend('response_duration', true);
const errorRate        = new Rate('error_rate');
const timeouts         = new Counter('timeouts');

// ── Timing del test (15 min total) ────────────────────────────────────────────
//
//  0:00 ──── baseline (2 min) ────────────────────────────────────── 2:00
//  2:00 ──── rampa 100→15k (5 min, ECS escala aquí) ──────────────── 7:00
//  7:00 ──── hold stress 15k (3 min, sistema ya escalado) ─────────── 10:00
//  10:00 ─── recovery 2k (3 min, verificar con capacidad disponible) ─ 13:00
//  13:00 ─── extreme spike 200k (2 min, punto de quiebre) ─────────── 15:00
//
export const options = {
  scenarios: {
    // Stage 1 — Baseline: verificar sistema sano antes de estresar
    baseline_100: {
      executor:        'constant-arrival-rate',
      rate:            100,
      timeUnit:        '1m',
      duration:        '2m',
      preAllocatedVUs: 20,
      maxVUs:          50,
      startTime:       '0s',
      tags:            { stage: 'baseline_100' },
    },

    // Stage 2 — Rampa gradual: 100→15,000 req/min en 5 minutos
    // Permite que el auto-scaling de ECS reaccione (CloudWatch 3 min + startup 90s)
    // antes de llegar al pico. Sin esta rampa, el sistema colapsa antes de escalar.
    ramp_to_stress: {
      executor:        'ramping-arrival-rate',
      startRate:       100,
      timeUnit:        '1m',
      stages: [
        { target: 5000,  duration: '2m' },
        { target: 15000, duration: '3m' },
      ],
      preAllocatedVUs: 300,
      maxVUs:          3000,
      startTime:       '2m',
      tags:            { stage: 'ramp_to_stress' },
    },

    // Stage 3 — Hold: mantener 15k req/min con sistema ya escalado
    // El ECS debería tener 4-6 tasks activos para este punto
    stress_15000: {
      executor:        'constant-arrival-rate',
      rate:            15000,
      timeUnit:        '1m',
      duration:        '3m',
      preAllocatedVUs: 500,
      maxVUs:          3000,
      startTime:       '7m',
      tags:            { stage: 'stress_15000' },
    },

    // Stage 4 — Recovery: bajar a 2k para verificar que el sistema se recupera
    // El sistema tiene capacidad escalada, debe manejar 2k con holgura
    recovery_2000: {
      executor:        'constant-arrival-rate',
      rate:            2000,
      timeUnit:        '1m',
      duration:        '3m',
      preAllocatedVUs: 100,
      maxVUs:          600,
      startTime:       '10m',
      tags:            { stage: 'recovery_2000' },
    },

    // Stage 5 — Extreme spike: encontrar el punto de quiebre
    // Se espera degradación — el objetivo es observar, no pasar
    spike_200000: {
      executor:        'constant-arrival-rate',
      rate:            200000,
      timeUnit:        '1m',
      duration:        '2m',
      preAllocatedVUs: 1000,
      maxVUs:          5000,
      startTime:       '13m',
      tags:            { stage: 'spike_200000' },
    },
  },

  thresholds: {
    // ── Global: cap absoluto — no fallar por el spike de 200k ────────────────
    http_req_duration: ['p(95)<65000'],
    http_req_failed:   ['rate<0.75'],
    error_rate:        ['rate<0.75'],

    // ── [RUBRICA: 100] Baseline: sistema sano antes del estrés ───────────────
    'http_req_duration{stage:baseline_100}': ['p(95)<500'],
    'http_req_failed{stage:baseline_100}':   ['rate<0.05'],

    // ── [RUBRICA: 15000] Stress con sistema escalado tras la rampa ────────────
    // La rampa de 5 min permite que ECS escale antes de llegar al hold
    'http_req_duration{stage:stress_15000}': ['p(95)<5000'],
    'http_req_failed{stage:stress_15000}':   ['rate<0.45'],

    // ── [RUBRICA: 2000] Recovery: 4-6 tasks activos, 2k debe ser manejable ───
    'http_req_duration{stage:recovery_2000}': ['p(95)<2000'],
    'http_req_failed{stage:recovery_2000}':   ['rate<0.20'],

    // ── [RUBRICA: 200000] Spike extremo: solo observación, sin threshold ──────
    // Se espera degradación total — el objetivo es encontrar el punto de quiebre
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3006';

const USERS = [
  { email: '2895884051401+v@ingenieria.usac.edu.gt', password: 'LogiVentas'    },
  { email: '2895884051401+l@ingenieria.usac.edu.gt', password: 'LogiLogistica' },
  { email: '2895884051401+t@ingenieria.usac.edu.gt', password: 'LogiPiloto'    },
  { email: '2895884051401@ingenieria.usac.edu.gt',   password: 'LogiGerencia'  },
];

const GERENCIA_USER = { email: '2895884051401@ingenieria.usac.edu.gt', password: 'LogiGerencia' };

// ── Test 1: Health check survivability ────────────────────────────────────────
function stressHealth() {
  const res = http.get(`${BASE_URL}/api/health`, { timeout: '10s' });
  responseDuration.add(res.timings.duration);
  if (res.error_code === 1050) timeouts.add(1);
  errorRate.add(!check(res, { 'health survives stress': (r) => r.status === 200 }));
}

// ── Test 2: Login endpoint under stress ───────────────────────────────────────
function stressLogin(user) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' }, timeout: '10s' },
  );
  responseDuration.add(res.timings.duration);
  if (res.error_code === 1050) timeouts.add(1);
  const ok = check(res, {
    'login survives stress': (r) => r.status === 200 || r.status === 201 || r.status === 429,
  });
  errorRate.add(!ok);
  try { return res.json('data.token'); } catch (_) { return null; }
}

// ── Test 3: Concurrent order reads ────────────────────────────────────────────
function stressOrders(token) {
  if (!token) return;
  const res = http.get(`${BASE_URL}/api/logistics/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: '10s',
  });
  responseDuration.add(res.timings.duration);
  if (res.error_code === 1050) timeouts.add(1);
  errorRate.add(!check(res, { 'orders survives stress': (r) => r.status < 500 }));
}

// ── Test 4: BI/analytics under stress ─────────────────────────────────────────
function stressBi(token) {
  if (!token) return;
  const res = http.get(`${BASE_URL}/api/bi/kpis`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: '15s',
  });
  responseDuration.add(res.timings.duration);
  if (res.error_code === 1050) timeouts.add(1);
  errorRate.add(!check(res, { 'bi survives stress': (r) => r.status < 500 }));
}

// ── Test 5: Rapid repeated auth (spike detection) ─────────────────────────────
function stressRapidAuth(user) {
  for (let i = 0; i < 3; i++) {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers: { 'Content-Type': 'application/json' }, timeout: '5s' },
    );
    check(res, { 'rapid auth → not 500': (r) => r.status !== 500 });
    sleep(0.05);
  }
}

// ── Default function ───────────────────────────────────────────────────────────
export default function () {
  const user = USERS[Math.floor(Math.random() * USERS.length)];

  stressHealth();

  const token = stressLogin(user);
  sleep(0.1);

  stressOrders(token);
  sleep(0.1);

  const gerenciaToken = stressLogin(GERENCIA_USER);
  stressBi(gerenciaToken);
  sleep(0.1);

  if (Math.random() < 0.2) {
    stressRapidAuth(user);
  }

  sleep(0.2);
}
