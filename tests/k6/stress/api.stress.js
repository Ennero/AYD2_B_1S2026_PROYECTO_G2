/**
 * LogiTrans — Stress Tests (k6)
 *
 * Pushes the system beyond expected limits to find breaking points,
 * bottlenecks, and recovery behaviour.
 *
 * Prerequisites:
 *   - docker compose up -d (LogiTrans stack running on port 3006)
 *   - k6 installed OR available via Docker:
 *       docker run --rm -i --network host grafana/k6 run - < tests/k6/stress/api.stress.js
 *
 * Run (local k6):
 *   k6 run tests/k6/stress/api.stress.js
 *   k6 run --env BASE_URL=http://myserver:3006 tests/k6/stress/api.stress.js
 *
 * Run (Docker k6 — no install needed):
 *   docker run --rm -i --network host grafana/k6 run - < tests/k6/stress/api.stress.js
 *
 * Save output to JSON:
 *   k6 run --out json=stress-result.json tests/k6/stress/api.stress.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const responseDuration = new Trend('response_duration', true);
const errorRate        = new Rate('error_rate');
const timeouts         = new Counter('timeouts');

// ── Scenario: spike pattern to find the breaking point ───────────────────────
export const options = {
  stages: [
    { duration: '1m',  target: 20  },  // baseline
    { duration: '2m',  target: 100 },  // ramp to stress level
    { duration: '3m',  target: 200 },  // push to high stress
    { duration: '2m',  target: 300 },  // near-break: 300 VUs
    { duration: '1m',  target: 400 },  // spike: find breaking point
    { duration: '2m',  target: 200 },  // partial recovery
    { duration: '2m',  target: 0   },  // full cool-down — check recovery
  ],
  thresholds: {
    // Under stress we accept degraded (but not completely broken) performance
    http_req_duration: ['p(95)<3000'],  // 95th percentile under 3 s during stress
    http_req_failed:   ['rate<0.15'],   // tolerate up to 15% failures under extreme load
    error_rate:        ['rate<0.15'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3006';

// Credenciales reales del seed del proyecto (database-seeder.ts)
const USERS = [
  { email: '2895884051401+v@ingenieria.usac.edu.gt', password: 'LogiVentas'    }, // AGENTE_OPERATIVO
  { email: '2895884051401+l@ingenieria.usac.edu.gt', password: 'LogiLogistica' }, // AGENTE_LOGISTICO
  { email: '2895884051401+t@ingenieria.usac.edu.gt', password: 'LogiPiloto'    }, // PILOTO
  { email: '2895884051401@ingenieria.usac.edu.gt',   password: 'LogiGerencia'  }, // GERENCIA
];

// BI solo acepta el rol GERENCIA — se usa un usuario dedicado para ese endpoint
const GERENCIA_USER = { email: '2895884051401@ingenieria.usac.edu.gt', password: 'LogiGerencia' };

// ── Test 1: Health check survivability under stress ───────────────────────────
function stressHealth() {
  const res = http.get(`${BASE_URL}/api/health`, { timeout: '5s' });
  responseDuration.add(res.timings.duration);
  if (res.error_code === 1050) timeouts.add(1);
  const ok = check(res, { 'health survives stress': (r) => r.status === 200 });
  errorRate.add(!ok);
}

// ── Test 2: Login endpoint under stress ───────────────────────────────────────
function stressLogin(user) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' }, timeout: '5s' },
  );
  responseDuration.add(res.timings.duration);
  if (res.error_code === 1050) timeouts.add(1);
  const ok = check(res, {
    'login survives stress': (r) => r.status === 200 || r.status === 201 || r.status === 429,
  });
  errorRate.add(!ok);
  try {
    return res.json('data.token');
  } catch (_) {
    return null;
  }
}

// ── Test 3: Concurrent order reads ────────────────────────────────────────────
function stressOrders(token) {
  if (!token) return;
  const res = http.get(`${BASE_URL}/api/logistics/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: '5s',
  });
  responseDuration.add(res.timings.duration);
  if (res.error_code === 1050) timeouts.add(1);
  const ok = check(res, {
    'orders survives stress': (r) => r.status < 500,
  });
  errorRate.add(!ok);
}

// ── Test 4: BI/analytics under stress ─────────────────────────────────────────
function stressBi(token) {
  if (!token) return;
  const res = http.get(`${BASE_URL}/api/bi/kpis`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: '8s',
  });
  responseDuration.add(res.timings.duration);
  if (res.error_code === 1050) timeouts.add(1);
  const ok = check(res, {
    'bi survives stress': (r) => r.status < 500,
  });
  errorRate.add(!ok);
}

// ── Test 5: Spike scenario — rapid repeated auth attempts ─────────────────────
function stressRapidAuth(user) {
  for (let i = 0; i < 3; i++) {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers: { 'Content-Type': 'application/json' }, timeout: '3s' },
    );
    check(res, { 'rapid auth → not 500': (r) => r.status !== 500 });
    sleep(0.1);
  }
}

// ── Default function ───────────────────────────────────────────────────────────
export default function () {
  const user = USERS[Math.floor(Math.random() * USERS.length)];

  stressHealth();

  const token = stressLogin(user);
  sleep(0.2);

  stressOrders(token);
  sleep(0.1);

  // BI requiere rol GERENCIA — se loguea con usuario dedicado
  const gerenciaToken = stressLogin(GERENCIA_USER);
  stressBi(gerenciaToken);
  sleep(0.1);

  // Every 5th VU iteration runs the rapid-auth spike scenario
  if (Math.random() < 0.2) {
    stressRapidAuth(user);
  }

  sleep(0.5);
}
