/**
 * LogiTrans — Load Tests (k6)
 *
 * Simulates normal expected traffic across the main API endpoints.
 * Goal: validate that the system holds steady-state performance
 *       under realistic concurrent usage.
 *
 * Prerequisites:
 *   - docker-compose up -d (LogiTrans stack running)
 *   - k6 installed: brew install k6
 *
 * Run:
 *   k6 run tests/k6/load/api.load.js
 *   k6 run --env BASE_URL=http://myserver:3000 tests/k6/load/api.load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const loginDuration = new Trend('login_duration', true);
const healthDuration = new Trend('health_duration', true);
const ordersDuration = new Trend('orders_duration', true);
const errorRate = new Rate('error_rate');

// ── Scenario: gradual ramp to 50 VUs, hold 3 minutes, ramp down ──────────────
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // warm-up: ramp to 10 VUs
    { duration: '1m', target: 30 },   // ramp to expected load: 30 VUs
    { duration: '1m', target: 50 },   // peak: hold 50 VUs
    { duration: '1m', target: 0 },   // cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% de requests bajo 500ms (umbral del enunciado)
    http_req_failed: ['rate<0.01'],  // menos del 1% de fallos
    login_duration: ['p(95)<1000'],
    health_duration: ['p(95)<200'],
    orders_duration: ['p(95)<500'],
    error_rate: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Credenciales del seed — un usuario por rol para simular tráfico mixto real
const USERS = [
  { email: 'piloto.01@logitrans.gt', password: 'seed$piloto.01@logitrans.gt', role: 'PILOTO' },
  { email: 'agente.logistico@logitrans.gt', password: 'seed$agente.logistico@logitrans.gt', role: 'AGENTE_LOGISTICO' },
  { email: 'cliente.01@comercializadoramaya.com', password: 'seed$cliente.01@comercializadoramaya.com', role: 'CLIENTE' },
];

// ── Test 1: Health check ──────────────────────────────────────────────────────
function testHealth() {
  const res = http.get(`${BASE_URL}/health`);
  healthDuration.add(res.timings.duration);
  const ok = check(res, { 'health → 200': (r) => r.status === 200 });
  errorRate.add(!ok);
}

// ── Test 2: Login ─────────────────────────────────────────────────────────────
function testLogin(user) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  loginDuration.add(res.timings.duration);
  console.log(`Login status: ${res.status}, body: ${res.body}`);
  const ok = check(res, {
    'login → 200': (r) => r.status === 200,
    'login → has token': (r) => {
      try { return !!r.json('data.token'); } catch { return false; }
    },
  });
  errorRate.add(!ok);

  try { return res.json('data.token'); } catch { return null; }
}

// ── Test 3: Listar órdenes del piloto ─────────────────────────────────────────
// GET /api/pilot/orders — autentica como PILOTO
function testPilotOrders(token) {
  const res = http.get(`${BASE_URL}/api/pilot/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  ordersDuration.add(res.timings.duration);
  const ok = check(res, {
    'pilot-orders → 200 or 403': (r) => r.status === 200 || r.status === 403,
  });
  errorRate.add(!ok);
}

// ── Test 4: Listar órdenes del cliente ────────────────────────────────────────
// GET /api/client/orders — autentica como CLIENTE
function testClientOrders(token) {
  const res = http.get(`${BASE_URL}/api/client/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const ok = check(res, {
    'client-orders → 200 or 403': (r) => r.status === 200 || r.status === 403,
  });
  errorRate.add(!ok);
}

// ── Test 5: KPIs de BI/Gerencia ───────────────────────────────────────────────
// GET /api/bi/kpis — autentica como GERENCIA
function testBiKpis(token) {
  const res = http.get(
    `${BASE_URL}/api/bi/kpis?period=MONTHLY&year=2026&month=4`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const ok = check(res, {
    'bi-kpis → 200 or 403': (r) => r.status === 200 || r.status === 403,
  });
  errorRate.add(!ok);
}

// ── Default function (called per VU iteration) ────────────────────────────────
export default function () {
  const user = USERS[Math.floor(Math.random() * USERS.length)];

  // Test 1: Health check (sin autenticación)
  testHealth();
  sleep(0.5);

  // Test 2: Login
  const token = testLogin(user);
  sleep(0.5);

  if (token) {
    // Test 3: Órdenes del piloto
    testPilotOrders(token);
    sleep(0.3);

    // Test 4: Órdenes del cliente
    testClientOrders(token);
    sleep(0.3);

    // Test 5: KPIs BI
    testBiKpis(token);
  }

  sleep(1);
}