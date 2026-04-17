/**
 * LogiTrans — Stress Tests (k6)
 *
 * Escalates through 4 stress levels as specified in the project rubric:
 *   Stage 1:      100 virtual users  (baseline)
 *   Stage 2:   15 000 virtual users  (high stress)
 *   Stage 3:    2 000 virtual users  (partial recovery)
 *   Stage 4:  200 000 virtual users  (extreme spike — find breaking point)
 *
 * Each stage uses constant-arrival-rate so the VU count maps to
 * requests-per-minute. Under extreme stages the system is expected to
 * degrade gracefully (not crash); thresholds are intentionally loose.
 *
 * Prerequisites:
 *   - Backend running: docker compose up -d   (API on :3006)
 *   - k6 installed or via Docker:
 *       docker run --rm -i --network host grafana/k6 run - < tests/k6/stress/api.stress.js
 *
 * Run (plain):
 *   k6 run tests/k6/stress/api.stress.js
 *
 * Run with JSON output (for reporting):
 *   k6 run --out json=tests/k6/reports/stress-result.json tests/k6/stress/api.stress.js
 *
 * Run with InfluxDB + Grafana (monitoring stack must be up):
 *   k6 run --out influxdb=http://localhost:8086/k6 tests/k6/stress/api.stress.js
 *
 * Run with Docker k6 + InfluxDB:
 *   docker run --rm -i --network host grafana/k6 run \
 *     --out influxdb=http://localhost:8086/k6 \
 *     - < tests/k6/stress/api.stress.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const responseDuration = new Trend('response_duration', true);
const errorRate        = new Rate('error_rate');
const timeouts         = new Counter('timeouts');

// ── 4 Stress Stages (constant-arrival-rate) ───────────────────────────────────
// Stage 1:     100 req/min   1 min  — baseline
// Stage 2:  15 000 req/min   3 min  — high stress
// Stage 3:   2 000 req/min   2 min  — partial recovery
// Stage 4: 200 000 req/min   2 min  — extreme spike (find breaking point)
export const options = {
  scenarios: {
    // Stage 1 — 100 usuarios / baseline
    stress_100: {
      executor:        'constant-arrival-rate',
      rate:            100,
      timeUnit:        '1m',
      duration:        '1m',
      preAllocatedVUs: 20,
      maxVUs:          150,
      startTime:       '0s',
      tags:            { stage: 'baseline_100' },
    },

    // Stage 2 — 15 000 usuarios / high stress
    stress_15000: {
      executor:        'constant-arrival-rate',
      rate:            15000,
      timeUnit:        '1m',
      duration:        '3m',
      preAllocatedVUs: 500,
      maxVUs:          3000,
      startTime:       '1m30s',
      tags:            { stage: 'stress_15000' },
    },

    // Stage 3 — 2 000 usuarios / recovery
    stress_2000: {
      executor:        'constant-arrival-rate',
      rate:            2000,
      timeUnit:        '1m',
      duration:        '2m',
      preAllocatedVUs: 200,
      maxVUs:          600,
      startTime:       '5m',
      tags:            { stage: 'recovery_2000' },
    },

    // Stage 4 — 200 000 usuarios / extreme spike
    stress_200000: {
      executor:        'constant-arrival-rate',
      rate:            200000,
      timeUnit:        '1m',
      duration:        '2m',
      preAllocatedVUs: 1000,
      maxVUs:          5000,
      startTime:       '7m30s',
      tags:            { stage: 'spike_200000' },
    },
  },

  thresholds: {
    // Under extreme stress we accept degraded (not completely broken) performance
    http_req_duration: ['p(95)<5000'],   // up to 5s p95 under extreme load
    http_req_failed:   ['rate<0.50'],    // tolerate up to 50% failures at spike
    error_rate:        ['rate<0.50'],
    // Baseline stage must remain healthy
    'http_req_duration{stage:baseline_100}': ['p(95)<500'],
    'http_req_failed{stage:baseline_100}':   ['rate<0.05'],
    // Recovery stage shows system bouncing back
    'http_req_duration{stage:recovery_2000}': ['p(95)<2000'],
    'http_req_failed{stage:recovery_2000}':   ['rate<0.20'],
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
