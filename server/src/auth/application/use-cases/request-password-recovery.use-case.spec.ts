/**
 * Unit tests for RequestPasswordRecoveryUseCase
 *
 * Por seguridad, este caso de uso SIEMPRE retorna éxito, sin importar
 * si el email existe o no en la base de datos.  Esto previene que un
 * atacante enumere qué correos están registrados ("user enumeration").
 *
 * Cuando el usuario sí existe y está activo:
 *   - Se crea un registro de recuperación con hash SHA-256.
 *   - Se envía el email de forma fire-and-forget (no bloquea la respuesta).
 *
 * Escenarios cubiertos:
 *   1. Retorna éxito aunque el email no exista (anti-enumeración).
 *   2. Retorna éxito aunque el usuario esté inactivo (anti-enumeración).
 *   3. Crea el registro de recuperación cuando el usuario existe y está activo.
 *   4. El token guardado en BD es el hash SHA-256 del token raw (nunca el raw).
 *   5. El registro expira en 30 minutos.
 *   6. La respuesta siempre indica expiresInMinutes = 30.
 *
 * Run: npm run test:unit
 * Run this file only: npm run test:unit -- request-password-recovery.use-case
 */

import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { createHash } from 'crypto';
import { RequestPasswordRecoveryUseCase } from './request-password-recovery.use-case';
import { AUTH_USER_REPOSITORY_TOKEN } from '../../domain/repositories/auth-user.repository.interface';
import { PASSWORD_RECOVERY_REPOSITORY_TOKEN } from '../../domain/repositories/password-recovery.repository.interface';
import { EmailService } from '../../../notifications/email/application/email.service';
import { UserRole } from '../../../domain/enums/user-role.enum';

// ── Factory ───────────────────────────────────────────────────────────────────

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    userId:       faker.number.int({ min: 1, max: 999 }),
    email:        faker.internet.email(),
    fullName:     faker.person.fullName(),
    role:         UserRole.AGENTE_OPERATIVO,
    passwordHash: faker.string.alphanumeric(60),
    isActive:     true,
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('RequestPasswordRecoveryUseCase', () => {
  let useCase:      RequestPasswordRecoveryUseCase;
  let userRepo:     { findByEmail: jest.Mock };
  let recoveryRepo: { create: jest.Mock };
  let emailService: { sendPasswordRecovery: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findByEmail: jest.fn(),
    };

    recoveryRepo = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    emailService = {
      sendPasswordRecovery: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestPasswordRecoveryUseCase,
        { provide: AUTH_USER_REPOSITORY_TOKEN,         useValue: userRepo },
        { provide: PASSWORD_RECOVERY_REPOSITORY_TOKEN, useValue: recoveryRepo },
        { provide: EmailService,                       useValue: emailService },
      ],
    }).compile();

    useCase = module.get(RequestPasswordRecoveryUseCase);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── Test 1 ────────────────────────────────────────────────────────────────

  it('retorna éxito aunque el email no esté registrado (anti-enumeración)', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({ email: faker.internet.email() });

    expect(result.expiresInMinutes).toBe(30);
    // No se crea registro ni se envía email
    expect(recoveryRepo.create).not.toHaveBeenCalled();
    expect(emailService.sendPasswordRecovery).not.toHaveBeenCalled();
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────

  it('retorna éxito aunque el usuario esté inactivo (anti-enumeración)', async () => {
    const inactiveUser = fakeUser({ isActive: false });
    userRepo.findByEmail.mockResolvedValue(inactiveUser);

    const result = await useCase.execute({ email: inactiveUser.email });

    expect(result.expiresInMinutes).toBe(30);
    expect(recoveryRepo.create).not.toHaveBeenCalled();
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────

  it('crea el registro de recuperación cuando el usuario existe y está activo', async () => {
    const user = fakeUser();
    userRepo.findByEmail.mockResolvedValue(user);

    await useCase.execute({ email: user.email });

    expect(recoveryRepo.create).toHaveBeenCalledTimes(1);
    const [createdRecord] = recoveryRepo.create.mock.calls[0] as [Record<string, unknown>][];
    expect(createdRecord.userId).toBe(user.userId);
    expect(typeof createdRecord.tokenHash).toBe('string');
    expect(createdRecord.tokenHash).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────

  it('guarda el hash SHA-256 del token, nunca el token en texto plano', async () => {
    const user = fakeUser();
    userRepo.findByEmail.mockResolvedValue(user);

    // Interceptamos el envío del email para capturar el token raw
    let capturedRawToken: string | null = null;
    emailService.sendPasswordRecovery.mockImplementation(
      ({ recoveryToken }: { recoveryToken: string }) => {
        capturedRawToken = recoveryToken;
        return Promise.resolve();
      },
    );

    await useCase.execute({ email: user.email });

    // Esperamos que el uso del repositorio haya finalizado
    await new Promise((r) => setImmediate(r));

    const [createdRecord] = recoveryRepo.create.mock.calls[0] as [Record<string, unknown>][];
    const expectedHash = createHash('sha256').update(capturedRawToken!).digest('hex');
    expect(createdRecord.tokenHash).toBe(expectedHash);
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────

  it('el registro de recuperación expira en ~30 minutos', async () => {
    const user = fakeUser();
    userRepo.findByEmail.mockResolvedValue(user);

    await useCase.execute({ email: user.email });

    const [createdRecord] = recoveryRepo.create.mock.calls[0] as [Record<string, unknown>][];
    const deltaMs     = (createdRecord.expiresAt as Date).getTime() - Date.now();
    const thirtyMinMs = 30 * 60 * 1000;

    // Tolerancia de ±5 segundos por tiempo de ejecución del test
    expect(deltaMs).toBeGreaterThan(thirtyMinMs - 5_000);
    expect(deltaMs).toBeLessThanOrEqual(thirtyMinMs + 5_000);
  });

  // ── Test 6 ────────────────────────────────────────────────────────────────

  it('siempre retorna expiresInMinutes = 30, incluso para usuarios válidos', async () => {
    const user = fakeUser();
    userRepo.findByEmail.mockResolvedValue(user);

    const result = await useCase.execute({ email: user.email });

    expect(result.expiresInMinutes).toBe(30);
  });
});
