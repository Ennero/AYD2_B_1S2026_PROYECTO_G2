import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Integration tests bootstrap a real NestJS app and hit real HTTP endpoints.
 * These tests require a running PostgreSQL instance (use docker-compose).
 *
 * Run: npm run test:integration
 */
describe('Health (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns 200 with db status', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toHaveProperty('status');
  });

  it('GET /api/health responds within 2 seconds', async () => {
    const start = Date.now();
    await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(Date.now() - start).toBeLessThan(2000);
  });
});
