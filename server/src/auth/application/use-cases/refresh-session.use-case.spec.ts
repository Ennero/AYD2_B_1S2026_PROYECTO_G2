/**
 * Unit tests for RefreshSessionUseCase
 *
 * El caso de uso renueva el JWT de un usuario activo sin necesidad
 * de que vuelva a ingresar su contraseña.  Solo funciona si el
 * sessionToken es válido y el usuario sigue activo.
 *
 * Escenarios cubiertos:
 *   1. Retorna nuevo token cuando la sesión y el usuario son válidos.
 *   2. Lanza UnauthorizedException cuando la sesión no existe o expiró.
 *   3. Lanza UnauthorizedException cuando el usuario está inactivo.
 *   4. Lanza UnauthorizedException cuando el usuario no existe en BD.
 *   5. Incrementa el contador de uso de la sesión en cada refresh.
 *   6. El JWT firmado contiene los campos correctos del payload.
 *
 * Run: npm run test:unit
 * Run this file only: npm run test:unit -- refresh-session.use-case
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { faker } from '@faker-js/faker';
import { RefreshSessionUseCase } from './refresh-session.use-case';
import { AUTH_USER_REPOSITORY_TOKEN } from '../../domain/repositories/auth-user.repository.interface';
import { USER_SESSION_REPOSITORY_TOKEN } from '../../domain/repositories/user-session.repository.interface';
import { UserRole } from '../../../domain/enums/user-role.enum';

// ── Factories ─────────────────────────────────────────────────────────────────

function fakeSession(overrides: Record<string, unknown> = {}) {
  return {
    sessionId:    faker.number.int({ min: 1, max: 9999 }),
    sessionUuid:  faker.string.uuid(),
    userId:       faker.number.int({ min: 1, max: 999 }),
    expirationAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

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

describe('RefreshSessionUseCase', () => {
  let useCase:     RefreshSessionUseCase;
  let userRepo:    { findById: jest.Mock };
  let sessionRepo: { findActiveByToken: jest.Mock; incrementUsage: jest.Mock };
  let jwtService:  { sign: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findById: jest.fn(),
    };

    sessionRepo = {
      findActiveByToken: jest.fn(),
      incrementUsage:    jest.fn().mockResolvedValue(undefined),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('refreshed.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionUseCase,
        { provide: AUTH_USER_REPOSITORY_TOKEN,    useValue: userRepo },
        { provide: USER_SESSION_REPOSITORY_TOKEN, useValue: sessionRepo },
        { provide: JwtService,                    useValue: jwtService },
      ],
    }).compile();

    useCase = module.get(RefreshSessionUseCase);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── Test 1 ────────────────────────────────────────────────────────────────

  it('retorna sessionUuid y token cuando la sesión y el usuario son válidos', async () => {
    const user    = fakeUser();
    const session = fakeSession({ userId: user.userId });
    sessionRepo.findActiveByToken.mockResolvedValue(session);
    userRepo.findById.mockResolvedValue(user);

    const result = await useCase.execute('valid-session-token');

    expect(result.token).toBe('refreshed.jwt.token');
    expect(result.sessionUuid).toBe(session.sessionUuid);
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────

  it('lanza UnauthorizedException cuando la sesión no existe o expiró', async () => {
    sessionRepo.findActiveByToken.mockResolvedValue(null);

    await expect(useCase.execute('expired-token')).rejects.toThrow(UnauthorizedException);
    // El usuario nunca se consulta si la sesión ya no es válida
    expect(userRepo.findById).not.toHaveBeenCalled();
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────

  it('lanza UnauthorizedException cuando el usuario está inactivo', async () => {
    const user    = fakeUser({ isActive: false });
    const session = fakeSession({ userId: user.userId });
    sessionRepo.findActiveByToken.mockResolvedValue(session);
    userRepo.findById.mockResolvedValue(user);

    await expect(useCase.execute('some-token')).rejects.toThrow(UnauthorizedException);
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────

  it('lanza UnauthorizedException cuando el usuario no existe en base de datos', async () => {
    const session = fakeSession();
    sessionRepo.findActiveByToken.mockResolvedValue(session);
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('some-token')).rejects.toThrow(UnauthorizedException);
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────

  it('incrementa el contador de uso de la sesión en cada refresh exitoso', async () => {
    const user    = fakeUser();
    const session = fakeSession({ userId: user.userId });
    sessionRepo.findActiveByToken.mockResolvedValue(session);
    userRepo.findById.mockResolvedValue(user);

    await useCase.execute('valid-token');

    expect(sessionRepo.incrementUsage).toHaveBeenCalledWith(session.sessionId);
  });

  // ── Test 6 ────────────────────────────────────────────────────────────────

  it('firma el JWT con los campos correctos (sub, email, role, fullName, sessionUuid)', async () => {
    const user    = fakeUser();
    const session = fakeSession({ userId: user.userId });
    sessionRepo.findActiveByToken.mockResolvedValue(session);
    userRepo.findById.mockResolvedValue(user);

    await useCase.execute('valid-token');

    const [payload] = jwtService.sign.mock.calls[0] as [Record<string, unknown>][];
    expect(payload.sub).toBe(user.userId);
    expect(payload.email).toBe(user.email);
    expect(payload.role).toBe(user.role);
    expect(payload.fullName).toBe(user.fullName);
    expect(payload.sessionUuid).toBe(session.sessionUuid);
  });
});
