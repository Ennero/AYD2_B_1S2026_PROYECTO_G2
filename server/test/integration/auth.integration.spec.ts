/**
 * Integration tests for the Auth API
 *
 * These tests boot the FULL NestJS application and hit real HTTP endpoints,
 * using a real PostgreSQL database.
 *
 * Prerequisites:
 *   docker-compose up -d          (DB + server must be reachable)
 *
 * The test process connects to the DB using the environment variables loaded
 * from server/.env (or process.env). For local runs without Docker env vars,
 * create server/.env.test pointing to localhost:5433.
 *
 * Run: npm run test:integration
 * Run this file only: npm run test:integration -- auth.integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { faker } from '@faker-js/faker';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

// ── Seeded credentials ────────────────────────────────────────────────────────
// These come from server/src/infrastructure/database/seeds/initial-seed.ts.
// Update if the seed file changes.
const SEEDED = {
  email: 'agente.operativo@logitrans.com',
  password: 'password123',
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Auth API (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let seededUserId: number;
  let originalPasswordHash: string;
  let createdTestUser = false; // true when beforeAll inserts the user itself

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    dataSource = app.get(DataSource);

    // Try to find the pre-seeded user.
    const rows = await dataSource.query<{ user_id: number; password_hash: string }[]>(
      `SELECT user_id, password_hash FROM users WHERE email = $1`,
      [SEEDED.email],
    );

    if (rows.length > 0) {
      // DB is already seeded — remember the original hash to restore it later.
      seededUserId = rows[0].user_id;
      originalPasswordHash = rows[0].password_hash;
    } else {
      // DB is not pre-seeded — create the test user so the suite is self-contained.
      // 10 bcrypt rounds is fast enough for test setup while still being realistic.
      const hash = await bcrypt.hash(SEEDED.password, 10);
      const [inserted] = await dataSource.query<{ user_id: number; password_hash: string }[]>(
        `INSERT INTO users (role, full_name, email, password_hash, is_active)
         VALUES ('AGENTE_OPERATIVO', 'Agente Operativo (test)', $1, $2, true)
         RETURNING user_id, password_hash`,
        [SEEDED.email, hash],
      );
      seededUserId = inserted.user_id;
      originalPasswordHash = inserted.password_hash;
      createdTestUser = true;
    }
  }, 30_000); // allow 30 s for DB connection on cold start

  afterAll(async () => {
    if (createdTestUser) {
      // Remove everything we created, in FK-safe order.
      await dataSource.query(
        `DELETE FROM password_recovery_tokens WHERE user_id = $1`,
        [seededUserId],
      );
      await dataSource.query(
        `DELETE FROM user_sessions WHERE user_id = $1`,
        [seededUserId],
      );
      await dataSource.query(`DELETE FROM users WHERE user_id = $1`, [seededUserId]);
    } else {
      // Restore the pre-existing user's original password hash.
      await dataSource.query(
        `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
        [originalPasswordHash, seededUserId],
      );
    }
    await app.close();
  });

  /**
   * Inserts a password_recovery_tokens row directly into the DB so integration
   * tests can exercise the reset-password endpoint without depending on the
   * email service.
   */
  async function insertRecoveryToken(
    userId: number,
    opts: { used?: boolean; expired?: boolean } = {},
  ): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = opts.expired
      ? new Date(Date.now() - 60_000)            // 1 min in the past
      : new Date(Date.now() + 30 * 60_000);      // 30 min in the future
    const usedAt = opts.used ? new Date().toISOString() : null;

    await dataSource.query(
      `INSERT INTO password_recovery_tokens (user_id, token_hash, expires_at, used_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, tokenHash, expiresAt.toISOString(), usedAt],
    );

    return rawToken;
  }

  // ── POST /api/auth/login ───────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns 200 with access_token for valid seeded credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(SEEDED);

      expect([200, 201]).toContain(res.status);
      const token = res.body.token ?? res.body.data?.token;
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT = header.payload.signature
    });

    it('sets an httpOnly cookie after successful login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(SEEDED);

      expect([200, 201]).toContain(res.status);
      const rawCookies = res.headers['set-cookie'] as string | string[] | undefined;
      const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
      const hasHttpOnly = cookies.some((c) => c.toLowerCase().includes('httponly'));
      expect(hasHttpOnly).toBe(true);
    });

    it('returns response body with expected data shape', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(SEEDED);

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      const { data } = res.body as { data: Record<string, unknown> };
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('role');
      expect(data).toHaveProperty('fullName');
    });

    it('returns 401 for an existing email with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: SEEDED.email, password: 'totally_wrong_password' })
        .expect(401);
    });

    it('returns 401 for a non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: faker.internet.email(), password: faker.internet.password() })
        .expect(401);
    });

    it('returns 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'somepassword' })
        .expect(400);
    });

    it('returns 400 when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: SEEDED.email })
        .expect(400);
    });
  });

  // ── POST /api/auth/refresh ─────────────────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    it('returns 401 when no sessionToken cookie is present', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .expect(401);
    });

    it('returns 401 for an invalid/unknown sessionToken cookie', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `sessionToken=${faker.string.alphanumeric(80)}`)
        .expect(401);
    });

    it('returns 200 with a new JWT when a valid sessionToken cookie is sent', async () => {
      // Step 1 — Login to obtain the httpOnly session cookie.
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(SEEDED);

      expect([200, 201]).toContain(loginRes.status);

      const rawCookies = loginRes.headers['set-cookie'] as string | string[];
      const cookieArr = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      const sessionCookie = cookieArr.find((c) => c.startsWith('sessionToken='));
      expect(sessionCookie).toBeDefined();

      // Step 2 — Refresh using that cookie.
      const refreshRes = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', sessionCookie!)
        .expect(200);

      expect(refreshRes.body).toHaveProperty('message');
      expect(refreshRes.body).toHaveProperty('data');
      const token = (refreshRes.body as { data: { token: string } }).data?.token;
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  // ── POST /api/auth/logout ──────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401);
    });

    it('returns 401 when an invalid Bearer token is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid.token.value')
        .expect(401);
    });

    it('returns 200 and clears the sessionToken cookie on valid JWT', async () => {
      // Step 1 — Obtain a fresh token.
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(SEEDED)
        .expect((r) => expect([200, 201]).toContain(r.status));

      const token = loginRes.body.token ?? (loginRes.body as { data: { token: string } }).data?.token;

      // Step 2 — Logout.
      const logoutRes = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(logoutRes.body).toHaveProperty('message');

      // The cookie should be cleared (Set-Cookie header present with max-age=0 or past Expires).
      const rawCookies = logoutRes.headers['set-cookie'] as string | string[] | undefined;
      const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
      const sessionCookie = cookies.find((c) => c.startsWith('sessionToken='));
      if (sessionCookie) {
        expect(sessionCookie.toLowerCase()).toMatch(/max-age=0|expires=.*1970/);
      }
    });

    it('returns 200 using the sessionToken cookie to identify the session', async () => {
      // Login — capturing both the JWT and the session cookie.
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(SEEDED);

      expect([200, 201]).toContain(loginRes.status);
      const token = loginRes.body.token ?? (loginRes.body as { data: { token: string } }).data?.token;
      const rawCookies = loginRes.headers['set-cookie'] as string | string[];
      const cookieArr = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      const sessionCookie = cookieArr.find((c) => c.startsWith('sessionToken=')) ?? '';

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', sessionCookie)
        .expect(200);
    });
  });

  // ── POST /api/auth/recovery ────────────────────────────────────────────────

  describe('POST /api/auth/recovery', () => {
    it('returns 200 for an existing email (recovery email dispatched)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/recovery')
        .send({ email: SEEDED.email })
        .expect(200);
    });

    it('returns 200 even for a non-existent email (prevents user enumeration)', async () => {
      // Security requirement: the response must be indistinguishable from a real match.
      await request(app.getHttpServer())
        .post('/api/auth/recovery')
        .send({ email: faker.internet.email() })
        .expect(200);
    });

    it('returns response body with message and data fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/recovery')
        .send({ email: SEEDED.email })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
    });
  });

  // ── POST /api/auth/password ────────────────────────────────────────────────
  //
  // NOTE: tests that need a valid token insert rows directly into the DB via
  // insertRecoveryToken(). The success test changes the seeded user's password;
  // afterAll() restores it to the original hash.

  describe('POST /api/auth/password', () => {
    it('returns 400 when the token field is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/password')
        .send({ password: 'NewPassword1', confirmation: 'NewPassword1' })
        .expect(400);
    });

    it('returns 400 when password is shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/password')
        .send({ token: 'anytoken', password: 'short', confirmation: 'short' })
        .expect(400);
    });

    it('returns 400 when password and confirmation do not match', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/password')
        .send({
          token: faker.string.alphanumeric(64),
          password: 'NewPassword1',
          confirmation: 'DifferentPass1',
        })
        .expect(400);
    });

    it('returns 401 for an invalid/unknown recovery token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/password')
        .send({
          token: faker.string.alphanumeric(64),
          password: 'NewPassword1',
          confirmation: 'NewPassword1',
        })
        .expect(401);
    });

    it('returns 401 for an expired recovery token', async () => {
      const expiredToken = await insertRecoveryToken(seededUserId, { expired: true });

      await request(app.getHttpServer())
        .post('/api/auth/password')
        .send({ token: expiredToken, password: 'NewPassword1', confirmation: 'NewPassword1' })
        .expect(401);
    });

    it('returns 401 for an already-used recovery token', async () => {
      const usedToken = await insertRecoveryToken(seededUserId, { used: true });

      await request(app.getHttpServer())
        .post('/api/auth/password')
        .send({ token: usedToken, password: 'NewPassword1', confirmation: 'NewPassword1' })
        .expect(401);
    });

    it('returns 400 when new password equals the current password', async () => {
      // Insert a valid token; this test does NOT consume it (BadRequest is returned
      // before the token gets marked as used), but we use a fresh token to avoid
      // coupling with other tests.
      const rawToken = await insertRecoveryToken(seededUserId);

      await request(app.getHttpServer())
        .post('/api/auth/password')
        .send({ token: rawToken, password: SEEDED.password, confirmation: SEEDED.password })
        .expect(400);
    });

    it('returns 200 and resets the password with a valid token', async () => {
      const rawToken = await insertRecoveryToken(seededUserId);
      const newPassword = 'UpdatedP@ss1';

      const res = await request(app.getHttpServer())
        .post('/api/auth/password')
        .send({ token: rawToken, password: newPassword, confirmation: newPassword })
        .expect(200);

      expect(res.body).toHaveProperty('message');

      // Verify the old password no longer works.
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(SEEDED)
        .expect(401);

      // Verify the new password works.
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: SEEDED.email, password: newPassword })
        .expect((r) => expect([200, 201]).toContain(r.status));

      // afterAll() restores the original hash, so subsequent test runs are clean.
    });
  });
});
