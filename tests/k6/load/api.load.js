/**
 * LogiTrans — Load Tests (k6)
 *
 * Simulates normal expected traffic across the main API endpoints.
 * Goal: validate that the system holds steady-state performance
 *       under realistic concurrent usage.
 *
 * Strategy: single role (AGENTE_LOGISTICO) — all endpoints return 200,
 *           keeping http_req_failed under the 1% threshold required
 *           by the project spec (200 TPS, p95 < 500ms, error rate < 1%).
 *
 * Prerequisites:
 *   - Backend running: npm run start:dev  OR  docker compose up -d
 *   - k6 installed:    brew install k6  /  choco install k6
 *
 * Run:
 *   k6 run api.load.js
 *   k6 run --env BASE_URL=http://myserver:3000 api.load.js
 *
 * Smoke test (1 VU, 1 iteration):
 *   k6 run api.load.js --vus 1 --iterations 1
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const healthDuration = new Trend('health_duration', true);
const loginDuration = new Trend('login_duration', true);
const ordersDuration = new Trend('orders_duration', true);
const orderDetailDuration = new Trend('order_detail_duration', true);
const binomialsDuration = new Trend('binomials_duration', true);
const errorRate = new Rate('error_rate');

// ── Scenario: gradual ramp to 50 VUs, hold 3 min, ramp down ──────────────────
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // warm-up: ramp to 10 VUs
    { duration: '2m', target: 30 },   // ramp to expected load: 30 VUs
    { duration: '3m', target: 50 },   // peak: hold 50 VUs
    { duration: '1m', target: 0 },   // cool-down
  ],
  thresholds: {
    // Umbral del enunciado: p95 < 500ms, error rate < 1%
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    // Métricas por endpoint
    health_duration: ['p(95)<200'],
    login_duration: ['p(95)<1000'],  // bcrypt añade latencia intencional
    orders_duration: ['p(95)<500'],
    order_detail_duration: ['p(95)<500'],
    binomials_duration: ['p(95)<500'],
    error_rate: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Un solo rol — AGENTE_LOGISTICO accede a todos los endpoints sin 403
const USER = {
  email: '2895884051401+l@ingenieria.usac.edu.gt',
  password: 'LogiLogistica',
};

// El ORDER_ID se obtiene dinámicamente en setup() y se pasa como data a cada VU

// ── setup(): corre una vez antes de todos los VUs ─────────────────────────────
// Obtiene un ORDER_ID real para usarlo en el test de detalle
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
  } catch (_) { /* sin órdenes en seed */ }

  return { orderId: '' };
}

// ── Test 1: Health check ──────────────────────────────────────────────────────
function testHealth() {
  const res = http.get(`${BASE_URL}/api/health`);
  healthDuration.add(res.timings.duration);

  const ok = check(res, {
    'health → 200': (r) => r.status === 200,
  });
  errorRate.add(!ok);
}

// ── Test 2: Login ─────────────────────────────────────────────────────────────
function testLogin() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: USER.email, password: USER.password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  loginDuration.add(res.timings.duration);

  const ok = check(res, {
    'login → 200': (r) => r.status === 200,
    'login → has token': (r) => {
      try { return !!r.json('data.token'); } catch { return false; }
    },
  });
  errorRate.add(!ok);

  try { return res.json('data.token'); } catch { return null; }
}

// ── Test 3: Listar órdenes logísticas ─────────────────────────────────────────
// GET /api/logistics/orders — lista órdenes pendientes de asignación
function testListOrders(token) {
  const res = http.get(`${BASE_URL}/api/logistics/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  ordersDuration.add(res.timings.duration);

  const ok = check(res, {
    'logistics-orders → 200': (r) => r.status === 200,
  });
  errorRate.add(!ok);
}

// ── Test 4: Detalle de una orden específica ───────────────────────────────────
// GET /api/logistics/orders/:id — detalle puntual antes de asignar
function testOrderDetail(token, orderId) {
  if (!orderId) return; // no hay orden del seed — saltar sin contar como error

  const res = http.get(`${BASE_URL}/api/logistics/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  orderDetailDuration.add(res.timings.duration);

  const ok = check(res, {
    'order-detail → 200': (r) => r.status === 200,
  });
  errorRate.add(!ok);
}

// ── Test 5: Binomios disponibles ──────────────────────────────────────────────
// GET /api/logistics/unit-binomials — binomios compatibles para asignar a una orden
function testBinomials(token, orderId) {
  // Si no hay orderId real, usar query sin filtro para que devuelva algo
  const url = orderId
    ? `${BASE_URL}/api/logistics/unit-binomials?orderId=${orderId}`
    : `${BASE_URL}/api/logistics/unit-binomials`;

  const res = http.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  binomialsDuration.add(res.timings.duration);

  const ok = check(res, {
    'binomials → 200': (r) => r.status === 200,
  });
  errorRate.add(!ok);
}

// ── Default function (called per VU iteration) ────────────────────────────────
export default function (data) {
  const orderId = data.orderId || '';

  // Test 1: Health check — sin autenticación
  testHealth();
  sleep(0.5);

  // Test 2: Login — obtener token para los siguientes tests
  const token = testLogin();
  sleep(0.5);

  if (!token) {
    // Si el login falló, no continuar con los tests autenticados
    sleep(1);
    return;
  }

  // Test 3: Listar órdenes logísticas
  testListOrders(token);
  sleep(0.3);

  // Test 4: Detalle de una orden
  testOrderDetail(token, orderId);
  sleep(0.3);

  // Test 5: Binomios disponibles para asignación
  testBinomials(token, orderId);
  sleep(1);
}