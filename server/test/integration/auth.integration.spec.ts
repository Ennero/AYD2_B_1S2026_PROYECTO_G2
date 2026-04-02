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
import { AppModule } from '../../src/app.module';

// ── Seeded credentials ────────────────────────────────────────────────────────
// These come from server/src/infrastructure/database/seeds/initial-seed.ts.
// Update if the seed file changes.
const SEEDED = {
  email:    'agente.operativo@logitrans.com',
  password: 'password123',
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Auth API (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  }, 30_000); // allow 30 s for DB connection on cold start

  afterAll(async () => {
    await app.close();
  });

  // ── POST /auth/login ───────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns 2xx with access_token for valid seeded credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(SEEDED);

      expect([200, 201]).toContain(res.status);
      // token lives either at root or nested under .data
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
      const cookies    = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
      const hasHttpOnly = cookies.some((c) => c.toLowerCase().includes('httponly'));
      expect(hasHttpOnly).toBe(true);
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

    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'somepassword' }) // no email
        .expect(400);
    });
  });

  // ── POST /auth/logout ──────────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('returns 200 when a valid JWT bearer token is provided', async () => {
      // Step 1 — obtain a fresh token
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(SEEDED)
        .expect((r) => expect([200, 201]).toContain(r.status));

      const token = loginRes.body.token ?? loginRes.body.data?.token;

      // Step 2 — logout using that token
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  // ── POST /auth/recovery ────────────────────────────────────────────────────

  describe('POST /api/auth/recovery', () => {
    it('returns 200 for an existing email (recovery email dispatched)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/recovery')
        .send({ email: SEEDED.email })
        .expect(200);
    });

    it('returns 200 even for a non-existent email (prevents user enumeration)', async () => {
      // Security requirement: the response must be indistinguishable from a real match
      await request(app.getHttpServer())
        .post('/api/auth/recovery')
        .send({ email: faker.internet.email() })
        .expect(200);
    });
  });
});
