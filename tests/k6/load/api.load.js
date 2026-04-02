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
 *   k6 run --env BASE_URL=http://myserver:3006 tests/k6/load/api.load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const loginDuration   = new Trend('login_duration',   true);
const healthDuration  = new Trend('health_duration',  true);
const ordersDuration  = new Trend('orders_duration',  true);
const errorRate       = new Rate('error_rate');

// ── Scenario: gradual ramp to 50 VUs, hold 3 minutes, ramp down ──────────────
export const options = {
  stages: [
    { duration: '1m', target: 10 },  // warm-up: ramp to 10 VUs
    { duration: '2m', target: 30 },  // ramp to expected load: 30 VUs
    { duration: '3m', target: 50 },  // peak: hold 50 VUs
    { duration: '1m', target: 0  },  // cool-down
  ],
  thresholds: {
    http_req_duration:    ['p(95)<800'],   // 95% of requests under 800 ms
    http_req_failed:      ['rate<0.01'],   // less than 1% failures
    login_duration:       ['p(95)<1000'],
    health_duration:      ['p(95)<200'],
    orders_duration:      ['p(95)<1000'],
    error_rate:           ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3006';

// Seeded credentials (from initial-seed.ts)
const USERS = [
  { email: 'agente.operativo@logitrans.com', password: 'password123' },
  { email: 'agente.logistico@logitrans.com', password: 'password123' },
  { email: 'cliente@logitrans.com',          password: 'password123' },
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
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  loginDuration.add(res.timings.duration);
  const ok = check(res, {
    'login → 200 or 201': (r) => r.status === 200 || r.status === 201,
    'login → has token':  (r) => !!r.json('access_token'),
  });
  errorRate.add(!ok);
  return res.json('access_token');
}

// ── Test 3: Authenticated orders list ────────────────────────────────────────
function testOrdersList(token) {
  const res = http.get(`${BASE_URL}/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  ordersDuration.add(res.timings.duration);
  const ok = check(res, {
    'orders → 200 or 403': (r) => r.status === 200 || r.status === 403,
  });
  errorRate.add(!ok);
}

// ── Test 4: Client portal orders ─────────────────────────────────────────────
function testClientOrders(token) {
  const res = http.get(`${BASE_URL}/client-portal/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const ok = check(res, {
    'client-orders → 200 or 403': (r) => r.status === 200 || r.status === 403,
  });
  errorRate.add(!ok);
}

// ── Test 5: BI/Gerencia summary (read-replica path) ──────────────────────────
function testBiSummary(token) {
  const res = http.get(`${BASE_URL}/bi/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const ok = check(res, {
    'bi-summary → 200 or 403': (r) => r.status === 200 || r.status === 403,
  });
  errorRate.add(!ok);
}

// ── Default function (called per VU iteration) ────────────────────────────────
export default function () {
  const user = USERS[Math.floor(Math.random() * USERS.length)];

  testHealth();
  sleep(0.5);

  const token = testLogin(user);
  sleep(0.5);

  if (token) {
    testOrdersList(token);
    sleep(0.3);
    testClientOrders(token);
    sleep(0.3);
    testBiSummary(token);
  }

  sleep(1);
}
