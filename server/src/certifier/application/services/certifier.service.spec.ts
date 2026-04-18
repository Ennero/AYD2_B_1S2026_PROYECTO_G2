/**
 * Unit tests for CertifierService
 *
 * Pattern: mock DataSource + EmailService so tests run without a real DB.
 * Focus on validatable business rules that don't require DB transactions.
 *
 * Run: npm run test:unit
 * Run this file only: npm run test:unit -- certifier.service
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { CertifierService } from './certifier.service';
import { EmailService } from '../../../notifications/email/application/email.service';
import { RabbitmqService } from '../../../infrastructure/messaging/rabbitmq.service';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';

// ── Factory ───────────────────────────────────────────────────────────────────

/** Builds a fake Invoice matching the TypeORM entity shape */
function fakeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    invoiceId: faker.number.int({ min: 1, max: 9999 }),
    invoiceNumber: `FEL-${faker.number.int({ min: 1000, max: 9999 })}`,
    clientNit: '1234567890123', // valid 13-digit Guatemalan NIT
    status: InvoiceStatus.BORRADOR,
    totalAmount: faker.number.float({
      min: 100,
      max: 99999,
      fractionDigits: 2,
    }),
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    clientName: faker.company.name(),
    orderId: faker.number.int({ min: 1, max: 999 }),
    serviceDescription: 'Transporte de carga general',
    felUuid: null,
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('CertifierService', () => {
  let service: CertifierService;
  let mockInvoiceRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    count: jest.Mock;
  };
  let mockDataSource: {
    getRepository: jest.Mock;
    transaction: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockEmailService: { sendFinanceInvoiceStatus: jest.Mock };
  let mockRabbitmqService: {
    publishInvoiceCertified: jest.Mock;
    publishInvoiceRejected: jest.Mock;
  };

  beforeEach(async () => {
    mockInvoiceRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockInvoiceRepo),
      transaction: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      }),
    };

    mockEmailService = {
      sendFinanceInvoiceStatus: jest.fn().mockResolvedValue(undefined),
    };

    mockRabbitmqService = {
      publishInvoiceCertified: jest.fn().mockResolvedValue(undefined),
      publishInvoiceRejected: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertifierService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EmailService, useValue: mockEmailService },
        { provide: RabbitmqService, useValue: mockRabbitmqService },
      ],
    }).compile();

    service = module.get<CertifierService>(CertifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── validateNit ────────────────────────────────────────────────────────────

  it('validateNit: returns isValid true when NIT matches exactly', async () => {
    const invoice = fakeInvoice({ clientNit: '1234567890123' });
    mockInvoiceRepo.findOne.mockResolvedValue(invoice);

    const result = await service.validateNit(
      invoice.invoiceId,
      '1234567890123',
    );

    expect(result.isValid).toBe(true);
  });

  it('validateNit: strips non-digit characters before comparing', async () => {
    // Common format in Guatemala: "123-456789-0123-4" — dashes should be ignored
    const invoice = fakeInvoice({ clientNit: '1234567890123' });
    mockInvoiceRepo.findOne.mockResolvedValue(invoice);

    const result = await service.validateNit(
      invoice.invoiceId,
      '123-4567-89012-3',
    );

    expect(result.isValid).toBe(true);
  });

  it('validateNit: returns isValid false when NIT has fewer than 13 digits', async () => {
    const invoice = fakeInvoice({ clientNit: '1234567890123' });
    mockInvoiceRepo.findOne.mockResolvedValue(invoice);

    const result = await service.validateNit(invoice.invoiceId, '12345');

    expect(result.isValid).toBe(false);
  });

  it('validateNit: returns isValid false when NIT has 13 digits but wrong value', async () => {
    const invoice = fakeInvoice({ clientNit: '1234567890123' });
    mockInvoiceRepo.findOne.mockResolvedValue(invoice);

    const result = await service.validateNit(
      invoice.invoiceId,
      '9999999999999',
    );

    expect(result.isValid).toBe(false);
  });

  it('validateNit: throws NotFoundException when invoice does not exist', async () => {
    mockInvoiceRepo.findOne.mockResolvedValue(null);

    await expect(service.validateNit(9999, '1234567890123')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ── rejectInvoice ──────────────────────────────────────────────────────────
  //
  // The empty-reason guard fires before any DB call, so no transaction mock needed.

  it('rejectInvoice: throws BadRequestException when reason is empty string', async () => {
    await expect(service.rejectInvoice(1, '')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejectInvoice: throws BadRequestException when reason is only whitespace', async () => {
    await expect(service.rejectInvoice(1, '   ')).rejects.toThrow(
      BadRequestException,
    );
  });
});
