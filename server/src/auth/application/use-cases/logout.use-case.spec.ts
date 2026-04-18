/**
 * Unit tests for LogoutUseCase
 *
 * El logout es idempotente: si la sesión ya no existe o nunca existió,
 * no se lanza ningún error — el usuario queda desconectado de todas formas.
 *
 * Se cubren cuatro escenarios:
 *   1. Revoca sesión usando sessionToken.
 *   2. Revoca sesión usando sessionUuid cuando no hay sessionToken.
 *   3. No hace nada cuando ninguna sesión coincide (idempotencia).
 *   4. Prefiere sessionToken sobre sessionUuid cuando ambos están presentes.
 *
 * Run: npm run test:unit
 * Run this file only: npm run test:unit -- logout.use-case
 */

import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { LogoutUseCase } from './logout.use-case';
import { USER_SESSION_REPOSITORY_TOKEN } from '../../domain/repositories/user-session.repository.interface';

// ── Factory ───────────────────────────────────────────────────────────────────

/** Simula el objeto UserSession que devolvería el repositorio */
function fakeSession(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: faker.number.int({ min: 1, max: 9999 }),
    sessionUuid: faker.string.uuid(),
    sessionToken: faker.string.alphanumeric(64),
    userId: faker.number.int({ min: 1, max: 999 }),
    expirationAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let sessionRepo: {
    findActiveByToken: jest.Mock;
    findActiveBySessionUuid: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    sessionRepo = {
      findActiveByToken: jest.fn(),
      findActiveBySessionUuid: jest.fn(),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        { provide: USER_SESSION_REPOSITORY_TOKEN, useValue: sessionRepo },
      ],
    }).compile();

    useCase = module.get(LogoutUseCase);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── Test 1 ────────────────────────────────────────────────────────────────

  it('revoca la sesión por sessionToken cuando existe', async () => {
    const session = fakeSession();
    sessionRepo.findActiveByToken.mockResolvedValue(session);

    await expect(
      useCase.execute({ sessionToken: session.sessionToken }),
    ).resolves.toBeUndefined();

    // Debe buscar por token y luego hacer soft-delete con el sessionId correcto
    expect(sessionRepo.findActiveByToken).toHaveBeenCalledWith(
      session.sessionToken,
    );
    expect(sessionRepo.softDelete).toHaveBeenCalledWith(session.sessionId);
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────

  it('revoca la sesión por sessionUuid cuando no se proporciona sessionToken', async () => {
    const session = fakeSession();
    // findActiveByToken no se llama (sin sessionToken)
    sessionRepo.findActiveBySessionUuid.mockResolvedValue(session);

    await expect(
      useCase.execute({ sessionUuid: session.sessionUuid }),
    ).resolves.toBeUndefined();

    expect(sessionRepo.findActiveByToken).not.toHaveBeenCalled();
    expect(sessionRepo.findActiveBySessionUuid).toHaveBeenCalledWith(
      session.sessionUuid,
    );
    expect(sessionRepo.softDelete).toHaveBeenCalledWith(session.sessionId);
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────

  it('es idempotente: no lanza error cuando ninguna sesión coincide', async () => {
    // Simula que la sesión ya expiró o nunca existió
    sessionRepo.findActiveByToken.mockResolvedValue(null);
    sessionRepo.findActiveBySessionUuid.mockResolvedValue(null);

    await expect(
      useCase.execute({ sessionToken: faker.string.alphanumeric(64) }),
    ).resolves.toBeUndefined();

    // softDelete nunca se llama si no hay sesión activa
    expect(sessionRepo.softDelete).not.toHaveBeenCalled();
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────

  it('prefiere sessionToken sobre sessionUuid cuando ambos están presentes', async () => {
    const session = fakeSession();
    sessionRepo.findActiveByToken.mockResolvedValue(session);

    await useCase.execute({
      sessionToken: session.sessionToken,
      sessionUuid: session.sessionUuid,
    });

    // Encontró la sesión vía token, por lo tanto NO intenta con sessionUuid
    expect(sessionRepo.findActiveByToken).toHaveBeenCalled();
    expect(sessionRepo.findActiveBySessionUuid).not.toHaveBeenCalled();
    expect(sessionRepo.softDelete).toHaveBeenCalledWith(session.sessionId);
  });
});
