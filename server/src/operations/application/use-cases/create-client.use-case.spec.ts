/**
 * Unit tests for CreateClientUseCase
 *
 * Crea un cliente empresa junto con su usuario de portal.
 * Incluye validaciones de negocio críticas:
 *   - NIT debe tener entre 8 y 13 dígitos.
 *   - La contraseña de portal debe tener al menos 12 caracteres.
 *   - No puede existir otro cliente con el mismo NIT.
 *   - No puede existir otro usuario con el mismo email.
 *
 * Si todo es válido, se persisten cliente y usuario en una transacción
 * atómica y se envía un email de bienvenida en segundo plano (fire-and-forget).
 *
 * Escenarios cubiertos:
 *   1. Lanza BadRequestException cuando el NIT tiene menos de 8 dígitos.
 *   2. Lanza BadRequestException cuando el NIT tiene más de 13 dígitos.
 *   3. Lanza BadRequestException cuando el NIT contiene letras.
 *   4. Lanza BadRequestException cuando la contraseña es menor a 12 caracteres.
 *   5. Lanza BadRequestException cuando ya existe un cliente con ese NIT.
 *   6. Lanza BadRequestException cuando ya existe un usuario con ese email.
 *   7. Crea cliente exitosamente y retorna los datos esperados.
 *   8. El email del usuario portal se normaliza a minúsculas.
 *   9. Usa GT y GTQ como defaults de país y moneda cuando no se especifican.
 *
 * Run: npm run test:unit
 * Run this file only: npm run test:unit -- create-client.use-case
 */

jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { CreateClientUseCase } from './create-client.use-case';
import { ClientFactory } from '../factories/client.factory';
import { EmailService } from '../../../notifications/email/application/email.service';
import { CountryCode } from '../../../domain/enums/country-code.enum';
import { CurrencyCode } from '../../../domain/enums/currency-code.enum';
import { Client } from '../../../infrastructure/database/typeorm/entities/client.entity';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** NIT válido de 10 dígitos */
const VALID_NIT = '1234567890';

/** Contraseña que cumple el mínimo de 12 caracteres */
const VALID_PASSWORD = 'Contraseña_Segura_123';

/** Genera un input mínimo válido para CreateClientUseCase */
function validInput(overrides: Record<string, unknown> = {}) {
  return {
    legalName:           faker.company.name(),
    nit:                 VALID_NIT,
    taxAddress:          faker.location.streetAddress(),
    primaryContactName:  faker.person.fullName(),
    primaryContactEmail: faker.internet.email().toLowerCase(),
    portalPassword:      VALID_PASSWORD,
    ...overrides,
  };
}

/** Simula un Client guardado que devuelve la transacción */
function fakeSavedClient(email: string, overrides: Record<string, unknown> = {}) {
  return {
    clientId:            faker.number.int({ min: 1, max: 999 }),
    clientCode:          `CLI-${faker.string.alphanumeric(6).toUpperCase()}`,
    legalName:           faker.company.name(),
    nit:                 VALID_NIT,
    primaryContactEmail: email,
    countryCode:         CountryCode.GT,
    currencyCode:        CurrencyCode.GTQ,
    taxRate:             0.12,
    primaryContactName:  faker.person.fullName(),
    primaryContactPhone: null,
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('CreateClientUseCase', () => {
  let useCase:       CreateClientUseCase;
  let mockClientRepo: { findOne: jest.Mock; save: jest.Mock };
  let mockUserRepo:   { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let mockManager:   { getRepository: jest.Mock };
  let mockDataSource: { getRepository: jest.Mock; transaction: jest.Mock };
  let mockClientFactory: { create: jest.Mock };
  let mockEmailService:  { sendWelcome: jest.Mock };

  beforeEach(async () => {
    mockClientRepo = {
      findOne: jest.fn(),
      save:    jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
      create:  jest.fn(),
      save:    jest.fn(),
    };

    // El manager dentro de la transacción
    mockManager = {
      getRepository: jest.fn((entity) => {
        if (entity === Client) return mockClientRepo;
        return mockUserRepo;
      }),
    };

    mockDataSource = {
      // Fuera de la transacción (verificaciones previas)
      getRepository: jest.fn((entity) => {
        if (entity === Client) return mockClientRepo;
        return mockUserRepo;
      }),
      // Ejecuta el callback con el manager mock
      transaction: jest.fn(async (cb: (manager: typeof mockManager) => Promise<unknown>) => {
        return cb(mockManager);
      }),
    };

    mockClientFactory = {
      create: jest.fn().mockImplementation((input) => ({ ...input })),
    };

    mockEmailService = {
      sendWelcome: jest.fn().mockResolvedValue(undefined),
    };

    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateClientUseCase,
        { provide: DataSource,     useValue: mockDataSource },
        { provide: ClientFactory,  useValue: mockClientFactory },
        { provide: EmailService,   useValue: mockEmailService },
      ],
    }).compile();

    useCase = module.get(CreateClientUseCase);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── Test 1 ────────────────────────────────────────────────────────────────

  it('lanza BadRequestException cuando el NIT tiene menos de 8 dígitos', async () => {
    await expect(
      useCase.execute(validInput({ nit: '1234567' })), // 7 dígitos
    ).rejects.toThrow(BadRequestException);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────

  it('lanza BadRequestException cuando el NIT tiene más de 13 dígitos', async () => {
    await expect(
      useCase.execute(validInput({ nit: '12345678901234' })), // 14 dígitos
    ).rejects.toThrow(BadRequestException);
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────

  it('lanza BadRequestException cuando el NIT contiene letras', async () => {
    await expect(
      useCase.execute(validInput({ nit: '123ABC890' })),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────

  it('lanza BadRequestException cuando la contraseña tiene menos de 12 caracteres', async () => {
    await expect(
      useCase.execute(validInput({ portalPassword: 'Corta_123' })), // 9 chars
    ).rejects.toThrow(BadRequestException);
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────

  it('lanza BadRequestException cuando ya existe un cliente con ese NIT', async () => {
    // Primer getRepository → clientRepo → findOne devuelve cliente existente
    mockClientRepo.findOne.mockResolvedValue({ clientId: 1, nit: VALID_NIT });
    mockUserRepo.findOne.mockResolvedValue(null);

    await expect(useCase.execute(validInput())).rejects.toThrow(BadRequestException);
    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  // ── Test 6 ────────────────────────────────────────────────────────────────

  it('lanza BadRequestException cuando ya existe un usuario con ese email', async () => {
    mockClientRepo.findOne.mockResolvedValue(null);   // NIT libre
    mockUserRepo.findOne.mockResolvedValue({ userId: 99 }); // email ocupado

    await expect(useCase.execute(validInput())).rejects.toThrow(BadRequestException);
    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  // ── Test 7 ────────────────────────────────────────────────────────────────

  it('crea el cliente exitosamente y retorna los datos esperados', async () => {
    const email     = faker.internet.email().toLowerCase();
    const saved     = fakeSavedClient(email);
    mockClientRepo.findOne.mockResolvedValue(null);
    mockUserRepo.findOne.mockResolvedValue(null);
    // Dentro de la transacción, save del cliente devuelve el savedClient
    mockClientRepo.save.mockResolvedValue(saved);
    mockUserRepo.create.mockReturnValue({ email });
    mockUserRepo.save.mockResolvedValue({ userId: 1 });

    const result = await useCase.execute(validInput({ primaryContactEmail: email }));

    expect(result.clientId).toBe(Number(saved.clientId));
    expect(result.clientCode).toBe(saved.clientCode);
    expect(result.nit).toBe(saved.nit);
    expect(result.portalUserEmail).toBe(email);
  });

  // ── Test 8 ────────────────────────────────────────────────────────────────

  it('normaliza el email del usuario portal a minúsculas', async () => {
    const emailMixed = 'Usuario.PORTAL@Empresa.COM';
    const emailLower = 'usuario.portal@empresa.com';
    const saved      = fakeSavedClient(emailLower);

    mockClientRepo.findOne.mockResolvedValue(null);
    mockUserRepo.findOne.mockResolvedValue(null);
    mockClientRepo.save.mockResolvedValue(saved);
    mockUserRepo.create.mockReturnValue({ email: emailLower });
    mockUserRepo.save.mockResolvedValue({ userId: 1 });

    const result = await useCase.execute(validInput({ primaryContactEmail: emailMixed }));

    expect(result.portalUserEmail).toBe(emailLower);
  });

  // ── Test 9 ────────────────────────────────────────────────────────────────

  it('usa GT y GTQ como defaults de país y moneda cuando no se especifican', async () => {
    const email  = faker.internet.email().toLowerCase();
    const saved  = fakeSavedClient(email);
    mockClientRepo.findOne.mockResolvedValue(null);
    mockUserRepo.findOne.mockResolvedValue(null);
    mockClientRepo.save.mockResolvedValue(saved);
    mockUserRepo.create.mockReturnValue({ email });
    mockUserRepo.save.mockResolvedValue({ userId: 1 });

    const result = await useCase.execute(validInput({ primaryContactEmail: email }));

    // La fábrica debe haberse llamado con GT como país y GTQ como moneda por defecto
    expect(mockClientFactory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        countryCode:  CountryCode.GT,
        currencyCode: CurrencyCode.GTQ,
        taxRate:      0.12,
      }),
    );
    expect(result.countryCode).toBe(CountryCode.GT);
    expect(result.currencyCode).toBe(CurrencyCode.GTQ);
  });
});
