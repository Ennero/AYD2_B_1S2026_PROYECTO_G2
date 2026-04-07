/**
 * Shared helpers for k6 load/stress tests.
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 *   macOS:  brew install k6
 *   Docker: docker run --rm -i grafana/k6 run - <script.js
 */

import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

/** Login and return the JWT access token */
export function getToken(email, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  // El backend devuelve { message, data: { token } }
  return res.json('data.token');
}

/** Common JSON headers (unauthenticated) */
export function jsonHeaders() {
  return { 'Content-Type': 'application/json' };
}

/** Common JSON headers with JWT bearer token */
export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Assert a response and record a custom pass/fail metric */
export function check200(res, label) {
  return check(res, { [`${label} → status 200`]: (r) => r.status === 200 });
}