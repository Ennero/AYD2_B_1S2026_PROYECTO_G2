/**
 * Shared helpers for k6 load/stress tests.
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 *   macOS:  brew install k6
 *   Docker: docker run --rm -i grafana/k6 run - <script.js
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3006';

/** Login and return the JWT access token */
export function getToken(email, password) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return res.json('access_token');
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
  // eslint-disable-next-line no-undef
  return check(res, { [`${label} → status 200`]: (r) => r.status === 200 });
}
