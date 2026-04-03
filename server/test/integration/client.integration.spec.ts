/**
 * Integration tests for the Client Portal API
 *
 * These tests boot the FULL NestJS application and hit real HTTP endpoints,
 * using a real PostgreSQL database.
 *
 * Prerequisites:
 *   docker-compose up -d          (DB + server must be reachable)
 *   npm run seed                  (or DB_AUTO_SEED=true)
 *
 * Run: npm run test:integration
 * Run this file only: npm run test:integration -- client.integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

// ── Seeded credentials ────────────────────────────────────────────────────────
// Client user seeded for ALIMENTOS DEL NORTE, S.A. (index 0 in CLIENT_BLUEPRINTS).
// Password set in database-seeder.ts: bcrypt.hash('Logi2026', 10)
const CLIENT = {
  email: '2895884051401+c@ingenieria.usac.edu.gt',
  password: 'Logi2026',
};

// Internal user (AGENTE_OPERATIVO) — used to verify role-guard returns 403.
const NON_CLIENT = {
  email: 'agente.operativo@logitrans.com',
  password: 'password123',
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Client Portal API (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // Tokens
  let clientToken: string;
  let nonClientToken: string;

  // Resolved from DB in beforeAll
  let userId: number;
  let clientId: number;
  let activeContractId: number;
  let cargoTypeId: number;
  let tempNonClientUserId: number; // temporary internal user created for role-guard test

  // Track test-created records for cleanup
  const createdContactIds: number[] = [];
  const createdOrderIds: number[] = [];
  const createdContractIds: number[] = [];

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Deletes all contracts whose contract_number starts with 'TEST-' for the
   * given client, including their FK children created by the
   * trg_sync_contract_defaults trigger (contract_rates, contract_routes,
   * contract_cargo_types).  Safe to call even if no test contracts exist.
   */
  async function cleanupTestContracts(cid: number) {
    const sub = `(SELECT contract_id FROM contracts WHERE client_id = $1 AND contract_number LIKE 'TEST-%')`;
    await dataSource.query(`DELETE FROM contract_rates    WHERE contract_id IN ${sub}`, [cid]);
    await dataSource.query(`DELETE FROM contract_routes   WHERE contract_id IN ${sub}`, [cid]);
    await dataSource.query(`DELETE FROM contract_cargo_types WHERE contract_id IN ${sub}`, [cid]);
    await dataSource.query(`DELETE FROM contracts WHERE client_id = $1 AND contract_number LIKE 'TEST-%'`, [cid]);
  }

  // ── beforeAll ──────────────────────────────────────────────────────────────

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    dataSource = app.get(DataSource);

    // Login as CLIENTE
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(CLIENT);
    expect([200, 201]).toContain(loginRes.status);
    clientToken = loginRes.body.data?.token;

    // Create a temporary AGENTE_OPERATIVO user for the role-guard test.
    // We create a fresh user to avoid depending on any seeded user's password state.
    const tempEmail = `test.role.guard.${Date.now()}@logitrans.test`;
    const tempPassword = 'TempPass123!';
    const tempHash = await bcrypt.hash(tempPassword, 10);
    const [tempUser] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (role, full_name, email, password_hash, is_active)
       VALUES ('AGENTE_OPERATIVO', 'Temp Non-Client (test)', $1, $2, true)
       RETURNING user_id`,
      [tempEmail, tempHash],
    );
    tempNonClientUserId = tempUser.user_id;

    const nonClientRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: tempEmail, password: tempPassword });
    expect([200, 201]).toContain(nonClientRes.status);
    nonClientToken = nonClientRes.body.data?.token;

    // Resolve DB IDs
    const [user] = await dataSource.query<{ user_id: number; client_id: number }[]>(
      `SELECT user_id, client_id FROM users WHERE email = $1`,
      [CLIENT.email],
    );
    userId = user.user_id;
    clientId = user.client_id;

    // Identify the seeded (non-test) contract by its name pattern regardless of
    // its current status — avoids picking up orphaned test contracts from prior runs.
    const [contract] = await dataSource.query<{ contract_id: number }[]>(
      `SELECT contract_id FROM contracts
       WHERE client_id = $1 AND contract_number NOT LIKE 'TEST-%'
       ORDER BY start_date ASC LIMIT 1`,
      [clientId],
    );
    activeContractId = contract?.contract_id;

    // Clean up any orphaned test contracts left by previous failed runs.
    // The trg_sync_contract_defaults trigger auto-creates contract_rates on every
    // contract INSERT/UPDATE, so FK children must be removed before the contract.
    await cleanupTestContracts(clientId);

    // Ensure the seeded contract is in VIGENTE state for the tests that need it.
    if (activeContractId) {
      await dataSource.query(
        `UPDATE contracts SET status = 'VIGENTE' WHERE contract_id = $1`,
        [activeContractId],
      );
    }

    const [cargoType] = await dataSource.query<{ cargo_type_id: number }[]>(
      `SELECT ct.cargo_type_id
       FROM cargo_types ct
       JOIN contract_cargo_types cct ON cct.cargo_type_id = ct.cargo_type_id
       WHERE cct.contract_id = $1
       LIMIT 1`,
      [activeContractId],
    );
    cargoTypeId = cargoType?.cargo_type_id;
  }, 30_000);

  // ── afterAll ───────────────────────────────────────────────────────────────

  afterAll(async () => {
    // 0. Clean up temporary non-client user
    if (tempNonClientUserId) {
      await dataSource.query(`DELETE FROM user_sessions WHERE user_id = $1`, [tempNonClientUserId]);
      await dataSource.query(`DELETE FROM users WHERE user_id = $1`, [tempNonClientUserId]);
    }
    // 1. Hard-delete test contacts (service only soft-deletes)
    if (createdContactIds.length > 0) {
      await dataSource.query(
        `DELETE FROM client_contacts WHERE contact_id = ANY($1::int[])`,
        [createdContactIds],
      );
    }
    // 2. Delete test orders (no FK child records for freshly created orders)
    if (createdOrderIds.length > 0) {
      await dataSource.query(
        `DELETE FROM orders WHERE order_id = ANY($1::int[])`,
        [createdOrderIds],
      );
    }
    // 3. Delete all test contracts (TEST-*) using the pattern-based helper so that
    //    orphaned contracts from previously failed runs are always cleaned up too.
    await cleanupTestContracts(clientId);
    // 4. Restore seeded contract to VIGENTE (it may have been set to BORRADOR by
    //    the contract accept/reject test setups)
    if (activeContractId) {
      await dataSource.query(
        `UPDATE contracts SET status = 'VIGENTE' WHERE contract_id = $1`,
        [activeContractId],
      );
    }
    await app.close();
  });

  // ── Authentication & Authorization ─────────────────────────────────────────

  describe('Authentication & Authorization guards', () => {
    it('returns 401 on any endpoint when unauthenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/client/profile')
        .expect(401);
    });

    it('returns 403 when authenticated with a non-CLIENTE role', async () => {
      await request(app.getHttpServer())
        .get('/api/client/profile')
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

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      const { data } = res.body;
      expect(data).toHaveProperty('clientName');
      expect(data).toHaveProperty('activeOrdersCount');
      expect(data).toHaveProperty('recentOrders');
      expect(data).toHaveProperty('alerts');
      expect(Array.isArray(data.recentOrders)).toBe(true);
    });
  });

  // ── GET /api/client/cargo-types ───────────────────────────────────────────

  describe('GET /api/client/cargo-types', () => {
    it('returns 200 with cargo types from the active contract', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/cargo-types')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('cargoTypeId');
      expect(res.body.data[0]).toHaveProperty('cargoName');
      expect(res.body.data[0]).toHaveProperty('requiresRefrigeration');
    });
  });

  // ── GET /api/client/contracts ─────────────────────────────────────────────

  describe('GET /api/client/contracts', () => {
    it('returns 200 with all contracts for the authenticated client', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/contracts')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      const contracts = res.body.data as { contractId: number; status: string }[];
      expect(contracts.some((c) => c.contractId === activeContractId)).toBe(true);
    });
  });

  // ── GET /api/client/contracts/active ─────────────────────────────────────

  describe('GET /api/client/contracts/active', () => {
    it('returns 200 with only VIGENTE contracts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/contracts/active')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      const contracts = res.body.data as { contractId: number; paymentTermDays: number }[];
      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts.length).toBeGreaterThan(0);
      expect(contracts[0]).toHaveProperty('contractId');
      expect(contracts[0]).toHaveProperty('paymentTermDays');
    });
  });

  // ── GET /api/client/contracts/:contractId ────────────────────────────────

  describe('GET /api/client/contracts/:contractId', () => {
    it('returns 200 with full contract detail for an owned contract', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/client/contracts/${activeContractId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      const { data } = res.body;
      expect(data).toHaveProperty('contractId', activeContractId);
      expect(data).toHaveProperty('cargoTypes');
      expect(data).toHaveProperty('routes');
      expect(data).toHaveProperty('rates');
      expect(Array.isArray(data.cargoTypes)).toBe(true);
    });

    it('returns 404 for a contract that does not belong to this client', async () => {
      await request(app.getHttpServer())
        .get('/api/client/contracts/999999')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);
    });
  });

  // ── GET /api/client/orders ────────────────────────────────────────────────

  describe('GET /api/client/orders', () => {
    it('returns 200 with paginated response shape', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      const { data } = res.body;
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('totalPages');
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('respects page and limit query parameters', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/orders?page=1&limit=3')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(3);
      expect(res.body.data.items.length).toBeLessThanOrEqual(3);
    });

    it('filters results when a search query is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/orders?search=ORD')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('items');
    });
  });

  // ── POST /api/client/orders ───────────────────────────────────────────────

  describe('POST /api/client/orders', () => {
    it('returns 201 with the created order shape', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/client/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          cargoTypeId,
          pickupAddress: 'Bodega Central, Zona 10, Guatemala',
          deliveryAddress: 'Destino de Prueba, Quetzaltenango',
          declaredWeightTon: 5.5,
          cargoDescription: 'Carga de prueba integración',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('data');
      const { data } = res.body;
      expect(data).toHaveProperty('orderId');
      expect(data).toHaveProperty('orderNumber');
      expect(data).toHaveProperty('status', 'REGISTRADA');
      createdOrderIds.push(data.orderId as number);
    });

    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/api/client/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ pickupAddress: 'Origen sin más campos' })
        .expect(400);
    });

    it('returns 400 when declaredWeightTon exceeds the maximum of 40', async () => {
      await request(app.getHttpServer())
        .post('/api/client/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          cargoTypeId,
          pickupAddress: 'Origen',
          deliveryAddress: 'Destino',
          declaredWeightTon: 50,
        })
        .expect(400);
    });

    it('returns 400 when cargoTypeId is not authorized by the active contract', async () => {
      await request(app.getHttpServer())
        .post('/api/client/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          cargoTypeId: 999999,
          pickupAddress: 'Origen',
          deliveryAddress: 'Destino',
          declaredWeightTon: 1,
        })
        .expect(400);
    });
  });

  // ── GET /api/client/orders/:orderId/tracking ──────────────────────────────

  describe('GET /api/client/orders/:orderId/tracking', () => {
    let trackingOrderId: number;

    beforeAll(async () => {
      // Prefer an order we created; fall back to any seeded order for this client
      if (createdOrderIds.length > 0) {
        trackingOrderId = createdOrderIds[0];
      } else {
        const [order] = await dataSource.query<{ order_id: number }[]>(
          `SELECT o.order_id
           FROM orders o
           JOIN contracts c ON c.contract_id = o.contract_id
           WHERE c.client_id = $1
           LIMIT 1`,
          [clientId],
        );
        trackingOrderId = order?.order_id;
      }
    });

    it('returns 200 with tracking data and logs array for an owned order', async () => {
      if (!trackingOrderId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/client/orders/${trackingOrderId}/tracking`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      const { data } = res.body;
      expect(data).toHaveProperty('orderId');
      expect(data).toHaveProperty('orderNumber');
      expect(data).toHaveProperty('logs');
      expect(Array.isArray(data.logs)).toBe(true);
    });

    it('returns 404 for a non-existent order ID', async () => {
      await request(app.getHttpServer())
        .get('/api/client/orders/999999/tracking')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);
    });
  });

  // ── GET /api/client/invoices ──────────────────────────────────────────────

  describe('GET /api/client/invoices', () => {
    it('returns 200 with paginated invoice response', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/invoices')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      const { data } = res.body;
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('supports search and pagination query params', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/invoices?search=FAC&page=1&limit=5')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(5);
    });
  });

  // ── GET /api/client/contacts ──────────────────────────────────────────────

  describe('GET /api/client/contacts', () => {
    it('returns 200 with an array of active contacts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/contacts')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── POST /api/client/contacts ─────────────────────────────────────────────

  describe('POST /api/client/contacts', () => {
    const newContactEmail = faker.internet.email();

    it('returns 201 with the created contact', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/client/contacts')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contactName: 'Integration Test Contact',
          contactEmail: newContactEmail,
          positionTitle: 'QA Tester',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('contactId');
      expect(res.body.data).toHaveProperty('contactEmail', newContactEmail);
      createdContactIds.push(res.body.data.contactId as number);
    });

    it('returns 400 when the email is already used by an active contact of this client', async () => {
      await request(app.getHttpServer())
        .post('/api/client/contacts')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contactName: 'Duplicate Email Contact',
          contactEmail: newContactEmail,
        })
        .expect(400);
    });

    it('returns 400 when contactName is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/client/contacts')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ contactEmail: faker.internet.email() })
        .expect(400);
    });

    it('returns 400 for an invalid phone format', async () => {
      await request(app.getHttpServer())
        .post('/api/client/contacts')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contactName: 'Bad Phone Contact',
          contactEmail: faker.internet.email(),
          contactPhone: '12345',
        })
        .expect(400);
    });
  });

  // ── PATCH /api/client/contacts/:contactId ────────────────────────────────

  describe('PATCH /api/client/contacts/:contactId', () => {
    let patchContactId: number;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/client/contacts')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contactName: 'Patch Target Contact',
          contactEmail: faker.internet.email(),
        });
      patchContactId = res.body.data?.contactId;
      if (patchContactId) createdContactIds.push(patchContactId);
    });

    it('returns 200 with the updated contact data', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/client/contacts/${patchContactId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ positionTitle: 'Updated Position Title' })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('positionTitle', 'Updated Position Title');
    });

    it('returns 404 for a contact that does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/api/client/contacts/999999')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ positionTitle: 'Ghost' })
        .expect(404);
    });
  });

  // ── DELETE /api/client/contacts/:contactId ───────────────────────────────

  describe('DELETE /api/client/contacts/:contactId', () => {
    let deleteContactId: number;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/client/contacts')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contactName: 'Delete Target Contact',
          contactEmail: faker.internet.email(),
        });
      deleteContactId = res.body.data?.contactId;
      if (deleteContactId) createdContactIds.push(deleteContactId);
    });

    it('returns 200 with a success message on soft-delete', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/client/contacts/${deleteContactId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });

    it('deleted contact no longer appears in the active contacts list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/contacts')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      const contactIds = (res.body.data as { contactId: number }[]).map((c) => c.contactId);
      expect(contactIds).not.toContain(deleteContactId);
    });

    it('returns 404 when trying to delete the same contact again', async () => {
      await request(app.getHttpServer())
        .delete(`/api/client/contacts/${deleteContactId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);
    });
  });

  // ── GET /api/client/account-statement ────────────────────────────────────

  describe('GET /api/client/account-statement', () => {
    it('returns 200 with full account statement including aging breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/account-statement')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      const { data } = res.body;
      expect(data).toHaveProperty('creditLimit');
      expect(data).toHaveProperty('totalOwed');
      expect(data).toHaveProperty('availableCredit');
      expect(data).toHaveProperty('aging');
      expect(data.aging).toHaveProperty('current');
      expect(data.aging).toHaveProperty('overdue30');
      expect(data.aging).toHaveProperty('critical');
    });
  });

  // ── GET /api/client/profile ───────────────────────────────────────────────

  describe('GET /api/client/profile', () => {
    it('returns 200 with user and company profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      const { data } = res.body;
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('company');
      expect(data.user).toHaveProperty('email', CLIENT.email);
      expect(data.company).toHaveProperty('legalName');
      expect(data.company).toHaveProperty('nit');
    });
  });

  // ── PATCH /api/client/profile ─────────────────────────────────────────────

  describe('PATCH /api/client/profile', () => {
    it('returns 200 when updating phone with a valid format', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/client/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ phone: '+50298765432' })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('phone', '+50298765432');
    });

    it('returns 400 for an invalid phone format', async () => {
      await request(app.getHttpServer())
        .patch('/api/client/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ phone: '123456' })
        .expect(400);
    });
  });

  // ── PATCH /api/client/profile/password ───────────────────────────────────

  describe('PATCH /api/client/profile/password', () => {
    it('returns 401 when current password is incorrect', async () => {
      await request(app.getHttpServer())
        .patch('/api/client/profile/password')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ currentPassword: 'WrongPassword!', newPassword: 'NewLogi2026!' })
        .expect(401);
    });

    it('returns 400 when new password is the same as the current one', async () => {
      await request(app.getHttpServer())
        .patch('/api/client/profile/password')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ currentPassword: CLIENT.password, newPassword: CLIENT.password })
        .expect(400);
    });

    it('returns 400 when newPassword is shorter than 6 characters', async () => {
      await request(app.getHttpServer())
        .patch('/api/client/profile/password')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ currentPassword: CLIENT.password, newPassword: 'abc' })
        .expect(400);
    });

    it('returns 200 and changes the password successfully, then restores it', async () => {
      const newPassword = 'NewLogi2026!';

      const res = await request(app.getHttpServer())
        .patch('/api/client/profile/password')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ currentPassword: CLIENT.password, newPassword })
        .expect(200);

      expect(res.body).toHaveProperty('message');

      // Restore the original password directly in the DB so subsequent runs are clean
      const originalHash = await bcrypt.hash(CLIENT.password, 10);
      await dataSource.query(
        `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
        [originalHash, userId],
      );
    });
  });

  // ── PATCH /api/client/contracts/:contractId/reject ────────────────────────
  // The DB has a partial unique index ux_client_active_contract that allows only
  // one contract in PENDIENTE or VIGENTE status per client.  We temporarily move
  // the seeded VIGENTE contract to BORRADOR before inserting our test PENDIENTE
  // contract, then restore it in the describe-level afterAll.

  describe('PATCH /api/client/contracts/:contractId/reject', () => {
    let pendingContractId: number;

    beforeAll(async () => {
      // Remove any orphaned test contracts from prior failed runs first.
      await cleanupTestContracts(clientId);
      // Move seeded VIGENTE → BORRADOR to satisfy the unique index
      await dataSource.query(
        `UPDATE contracts SET status = 'BORRADOR' WHERE contract_id = $1`,
        [activeContractId],
      );
      const [row] = await dataSource.query<{ contract_id: number }[]>(
        `INSERT INTO contracts (client_id, contract_number, status, start_date, end_date, payment_term_days)
         VALUES ($1, $2, 'PENDIENTE', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 30)
         RETURNING contract_id`,
        [clientId, `TEST-REJECT-${Date.now()}`],
      );
      pendingContractId = row.contract_id;
      createdContractIds.push(pendingContractId);
    });

    afterAll(async () => {
      // Restore seeded contract to VIGENTE so the accept-describe can repeat the pattern
      await dataSource.query(
        `UPDATE contracts SET status = 'VIGENTE' WHERE contract_id = $1`,
        [activeContractId],
      );
    });

    it('returns 200 and transitions the contract status to RECHAZADO', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/client/contracts/${pendingContractId}/reject`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.status).toBe('RECHAZADO');
    });

    it('returns 400 when trying to reject a non-PENDIENTE contract', async () => {
      // The seeded contract is VIGENTE — cannot be rejected
      await request(app.getHttpServer())
        .patch(`/api/client/contracts/${activeContractId}/reject`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(400);
    });

    it('returns 404 for a contract that does not belong to the client', async () => {
      await request(app.getHttpServer())
        .patch('/api/client/contracts/999999/reject')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);
    });
  });

  // ── PATCH /api/client/contracts/:contractId/accept ────────────────────────
  // Runs LAST.  Same trick: temporarily move the seeded VIGENTE → BORRADOR to
  // satisfy the unique index, insert a PENDIENTE test contract, then accept it.
  // The suite-level afterAll restores the seeded contract to VIGENTE.

  describe('PATCH /api/client/contracts/:contractId/accept', () => {
    let pendingContractId: number;

    beforeAll(async () => {
      // Remove any orphaned test contracts from prior failed runs first.
      await cleanupTestContracts(clientId);
      // Move seeded VIGENTE → BORRADOR so the PENDIENTE insert won't conflict
      await dataSource.query(
        `UPDATE contracts SET status = 'BORRADOR' WHERE contract_id = $1`,
        [activeContractId],
      );
      const [row] = await dataSource.query<{ contract_id: number }[]>(
        `INSERT INTO contracts (client_id, contract_number, status, start_date, end_date, payment_term_days)
         VALUES ($1, $2, 'PENDIENTE', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 30)
         RETURNING contract_id`,
        [clientId, `TEST-ACCEPT-${Date.now()}`],
      );
      pendingContractId = row.contract_id;
      createdContractIds.push(pendingContractId);
    });

    it('returns 200 and transitions the contract to VIGENTE', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/client/contracts/${pendingContractId}/accept`)
        .set('Authorization', `Bearer ${clientToken}`)
        // contracts_check1 requires credit_limit IS NOT NULL when status = 'VIGENTE'
        .send({ creditLimit: 10000 })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.status).toBe('VIGENTE');
    });

    it('returns 400 when trying to accept a non-PENDIENTE contract', async () => {
      // activeContractId is BORRADOR at this point (set in beforeAll) — not PENDIENTE
      await request(app.getHttpServer())
        .patch(`/api/client/contracts/${activeContractId}/accept`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({})
        .expect(400);
    });

    it('returns 404 for a contract that does not belong to the client', async () => {
      await request(app.getHttpServer())
        .patch('/api/client/contracts/999999/accept')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({})
        .expect(404);
    });
  });
});
