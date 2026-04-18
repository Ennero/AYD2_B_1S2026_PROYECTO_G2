/**
 * Integration tests for the Client Portal API
 *
 * Boots the full NestJS application and hits real HTTP endpoints
 * using a real PostgreSQL database (seeded via globalSetup).
 *
 * Run: npm run test:integration
 * Run this file only: npm run test:integration -- client.integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

// Seeded CLIENT user (ALIMENTOS DEL NORTE, S.A. — index 0 in CLIENT_BLUEPRINTS)
const CLIENT = {
  email: '2895884051401+c@ingenieria.usac.edu.gt',
  password: 'Logi2026',
};

describe('Client Portal API (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let clientToken: string;
  let nonClientToken: string;
  let tempNonClientUserId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);

    // Login as CLIENTE
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(CLIENT);
    expect([200, 201]).toContain(loginRes.status);
    clientToken = loginRes.body.data?.token;

    // Create a temporary AGENTE_OPERATIVO user to test the role-guard (403)
    const tempEmail = `test.role.guard.${Date.now()}@logitrans.test`;
    const tempHash = await bcrypt.hash('TempPass123!', 10);
    const [tempUser] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (role, full_name, email, password_hash, is_active)
       VALUES ('AGENTE_OPERATIVO', 'Temp Non-Client (test)', $1, $2, true)
       RETURNING user_id`,
      [tempEmail, tempHash],
    );
    tempNonClientUserId = tempUser.user_id;

    const nonClientRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: tempEmail, password: 'TempPass123!' });
    expect([200, 201]).toContain(nonClientRes.status);
    nonClientToken = nonClientRes.body.data?.token;
  }, 30_000);

  afterAll(async () => {
    await dataSource.query(`DELETE FROM user_sessions WHERE user_id = $1`, [
      tempNonClientUserId,
    ]);
    await dataSource.query(`DELETE FROM users WHERE user_id = $1`, [
      tempNonClientUserId,
    ]);
    await app.close();
  });

  // ── Authentication & Authorization guards ─────────────────────────────────

  describe('Authentication & Authorization guards', () => {
    it('returns 401 on any endpoint when unauthenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/client/dashboard/summary')
        .expect(401);
    });

    it('returns 403 when authenticated with a non-CLIENTE role', async () => {
      await request(app.getHttpServer())
        .get('/api/client/dashboard/summary')
        .set('Authorization', `Bearer ${nonClientToken}`)
        .expect(403);
    });
  });

  // ── GET /api/client/dashboard/summary ─────────────────────────────────────

  describe('GET /api/client/dashboard/summary', () => {
    it('returns 200 with dashboard summary shape', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/dashboard/summary')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      const { data } = res.body as { data: Record<string, unknown> };
      expect(data).toHaveProperty('recentOrders');
    });
  });
});
