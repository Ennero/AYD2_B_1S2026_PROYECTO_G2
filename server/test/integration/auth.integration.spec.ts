/**
 * Integration tests for the Auth API
 *
 * Boots the full NestJS application and hits real HTTP endpoints
 * using a real PostgreSQL database.
 *
 * Run: npm run test:integration
 * Run this file only: npm run test:integration -- auth.integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

const SEEDED = {
  email: 'agente.operativo@logitrans.com',
  password: 'password123',
};

describe('Auth API (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let seededUserId: number;
  let createdTestUser = false;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    dataSource = app.get(DataSource);

    const rows = await dataSource.query<{ user_id: number }[]>(
      `SELECT user_id FROM users WHERE email = $1`,
      [SEEDED.email],
    );

    if (rows.length > 0) {
      seededUserId = rows[0].user_id;
    } else {
      const hash = await bcrypt.hash(SEEDED.password, 10);
      const [inserted] = await dataSource.query<{ user_id: number }[]>(
        `INSERT INTO users (role, full_name, email, password_hash, is_active)
         VALUES ('AGENTE_OPERATIVO', 'Agente Operativo (test)', $1, $2, true)
         RETURNING user_id`,
        [SEEDED.email, hash],
      );
      seededUserId = inserted.user_id;
      createdTestUser = true;
    }
  }, 30_000);

  afterAll(async () => {
    if (createdTestUser) {
      await dataSource.query(`DELETE FROM user_sessions WHERE user_id = $1`, [seededUserId]);
      await dataSource.query(`DELETE FROM users WHERE user_id = $1`, [seededUserId]);
    }
    await app.close();
  });

  // ── POST /api/auth/login ───────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns 200 with a JWT for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(SEEDED);

      expect([200, 201]).toContain(res.status);
      const token = res.body.token ?? res.body.data?.token;
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('returns 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: SEEDED.email, password: 'wrong_password' })
        .expect(401);
    });

    it('returns 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'somepassword' })
        .expect(400);
    });
  });
});
