/**
 * LogiTrans — Load Tests (k6)
 *
 * Simulates 5 escalating load levels as specified in the project rubric:
 *   Scenario 1:  100 virtual users / 1 min
 *   Scenario 2: 1000 virtual users / 3 min
 *   Scenario 3: 2000 virtual users / 5 min
 *   Scenario 4: 5000 virtual users / 1 min
 *   Scenario 5: 10000 virtual users / 5 min
 *
 * Each scenario uses constant-arrival-rate (rate = usuarios/min) so the
 * "virtual users" figure maps directly to requests-per-minute, allowing
 * k6 to auto-scale actual VUs up to maxVUs to sustain the arrival rate.
 *
 * Prerequisites:
 *   - Backend running: docker compose up -d   (API on :3006)
 *   - k6 installed:    brew install k6  /  choco install k6
 *
 * Run (plain):
 *   k6 run tests/k6/load/api.load.js
 *
 * Run with JSON output (for reporting):
 *   k6 run --out json=tests/k6/reports/load-result.json tests/k6/load/api.load.js
 *
 * Run with InfluxDB + Grafana (docker-compose monitoring stack must be up):
 *   k6 run --out influxdb=http://localhost:8086/k6 tests/k6/load/api.load.js
 *
 * Smoke test (1 VU, 1 iteration):
 *   k6 run --vus 1 --iterations 1 tests/k6/load/api.load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const healthDuration      = new Trend('health_duration', true);
const loginDuration       = new Trend('login_duration', true);
const ordersDuration      = new Trend('orders_duration', true);
const orderDetailDuration = new Trend('order_detail_duration', true);
const binomialsDuration   = new Trend('binomials_duration', true);
const errorRate           = new Rate('error_rate');

// ── 5 Load Scenarios (constant-arrival-rate) ──────────────────────────────────
// Each scenario fires `rate` iterations per `timeUnit` for `duration`.
// k6 spins up as many VUs as needed (up to maxVUs) to sustain the rate.
export const options = {
  scenarios: {
    // Scenario 1 — 100 usuarios / 1 min
    load_100: {
      executor:        'constant-arrival-rate',
      rate:            100,
      timeUnit:        '1m',
      duration:        '1m',
      preAllocatedVUs: 20,
      maxVUs:          150,
      startTime:       '0s',
      tags:            { scenario: 'load_100' },
    },

    // Scenario 2 — 1000 usuarios / 3 min
    load_1000: {
      executor:        'constant-arrival-rate',
      rate:            1000,
      timeUnit:        '1m',
      duration:        '3m',
      preAllocatedVUs: 100,
      maxVUs:          300,
      startTime:       '1m30s',
      tags:            { scenario: 'load_1000' },
    },

    // Scenario 3 — 2000 usuarios / 5 min
    load_2000: {
      executor:        'constant-arrival-rate',
      rate:            2000,
      timeUnit:        '1m',
      duration:        '5m',
      preAllocatedVUs: 200,
      maxVUs:          500,
      startTime:       '5m',
      tags:            { scenario: 'load_2000' },
    },

    // Scenario 4 — 5000 usuarios / 1 min
    load_5000: {
      executor:        'constant-arrival-rate',
      rate:            5000,
      timeUnit:        '1m',
      duration:        '1m',
      preAllocatedVUs: 400,
      maxVUs:          1000,
      startTime:       '10m30s',
      tags:            { scenario: 'load_5000' },
    },

    // Scenario 5 — 10000 usuarios / 5 min
    load_10000: {
      executor:        'constant-arrival-rate',
      rate:            10000,
      timeUnit:        '1m',
      duration:        '5m',
      preAllocatedVUs: 600,
      maxVUs:          2000,
      startTime:       '12m',
      tags:            { scenario: 'load_10000' },
    },
  },

  thresholds: {
    // Global thresholds — must hold across all scenarios
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],
    // Per-endpoint thresholds
    health_duration:       ['p(95)<200'],
    login_duration:        ['p(95)<1000'],
    orders_duration:       ['p(95)<500'],
    order_detail_duration: ['p(95)<500'],
    binomials_duration:    ['p(95)<500'],
    error_rate:            ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3006';

const USER = {
  email:    '2895884051401+l@ingenieria.usac.edu.gt',
  password: 'LogiLogistica',
};

// ── setup(): runs once — fetches a real orderId to use in detail/binomials ───
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: USER.email, password: USER.password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const token = loginRes.json('data.token');
  if (!token) return { orderId: '' };

  const ordersRes = http.get(`${BASE_URL}/api/logistics/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  try {
    const orders = ordersRes.json('data');
    if (Array.isArray(orders) && orders.length > 0) {
      return { orderId: orders[0].orderId };
    }
  } catch (_) { /* no orders in seed */ }
  return { orderId: '' };
}

// ── Test functions ────────────────────────────────────────────────────────────
function testHealth() {
  const res = http.get(`${BASE_URL}/api/health`);
  healthDuration.add(res.timings.duration);
  errorRate.add(!check(res, { 'health → 200': (r) => r.status === 200 }));
}

function testLogin() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: USER.email, password: USER.password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  loginDuration.add(res.timings.duration);
  const ok = check(res, {
    'login → 200':       (r) => r.status === 200,
    'login → has token': (r) => { try { return !!r.json('data.token'); } catch { return false; } },
  });
  errorRate.add(!ok);
  try { return res.json('data.token'); } catch { return null; }
}

function testListOrders(token) {
  const res = http.get(`${BASE_URL}/api/logistics/orders`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  ordersDuration.add(res.timings.duration);
  errorRate.add(!check(res, { 'logistics-orders → 200': (r) => r.status === 200 }));
}

function testOrderDetail(token, orderId) {
  if (!orderId) return;
  const res = http.get(`${BASE_URL}/api/logistics/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  orderDetailDuration.add(res.timings.duration);
  errorRate.add(!check(res, { 'order-detail → 200': (r) => r.status === 200 }));
}

function testBinomials(token, orderId) {
  const url = orderId
    ? `${BASE_URL}/api/logistics/unit-binomials?orderId=${orderId}`
    : `${BASE_URL}/api/logistics/unit-binomials`;
  const res = http.get(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  binomialsDuration.add(res.timings.duration);
  errorRate.add(!check(res, { 'binomials → 200': (r) => r.status === 200 }));
}

// ── Default function (executed per VU iteration) ──────────────────────────────
export default function (data) {
  const orderId = data?.orderId || '';

  testHealth();
  sleep(0.3);

  const token = testLogin();
  sleep(0.3);

  if (!token) { sleep(1); return; }

  testListOrders(token);
  sleep(0.2);

  testOrderDetail(token, orderId);
  sleep(0.2);

  testBinomials(token, orderId);
  sleep(0.5);
}
