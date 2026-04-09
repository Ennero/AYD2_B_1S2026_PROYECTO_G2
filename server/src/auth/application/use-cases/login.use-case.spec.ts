/**
 * Unit tests for LoginUseCase
 *
 * Pattern: mock ALL external dependencies (repos, services) so the test
 * validates only the business logic inside the use case itself.
 *
 * Run: npm run test:unit
 * Run this file only: npm run test:unit -- login.use-case
 */

// Must be hoisted before any imports so Jest replaces the module everywhere
jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { LoginUseCase } from './login.use-case';
import { AUTH_USER_REPOSITORY_TOKEN } from '../../domain/repositories/auth-user.repository.interface';
import { USER_SESSION_REPOSITORY_TOKEN } from '../../domain/repositories/user-session.repository.interface';
import { UserRole } from '../../../domain/enums/user-role.enum';

// ── Factory ───────────────────────────────────────────────────────────────────

/** Builds a fake User object matching the shape returned by IAuthUserRepository */
function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    userId:       faker.number.int({ min: 1, max: 9999 }),
    email:        faker.internet.email(),
    passwordHash: faker.string.alphanumeric(60), // placeholder for bcrypt hash
    fullName:     faker.person.fullName(),
    role:         UserRole.AGENTE_OPERATIVO,
    isActive:     true,
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo:    { findByEmail: jest.Mock };
  let sessionRepo: { create: jest.Mock };
  let jwtService:  { sign: jest.Mock };

  beforeEach(async () => {
    userRepo    = { findByEmail: jest.fn() };
    sessionRepo = { create: jest.fn().mockResolvedValue(undefined) };
    jwtService  = { sign:   jest.fn().mockReturnValue('mocked.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: AUTH_USER_REPOSITORY_TOKEN,    useValue: userRepo },
        { provide: USER_SESSION_REPOSITORY_TOKEN, useValue: sessionRepo },
        { provide: JwtService,                    useValue: jwtService },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── Test 1 ────────────────────────────────────────────────────────────────

  it('returns token and sessionToken for valid credentials', async () => {
    const user = fakeUser();
    userRepo.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await useCase.execute({ email: user.email, password: 'correct_password' });

    expect(result.data.token).toBe('mocked.jwt.token');
    expect(result.sessionToken).toBeTruthy();
    expect(result.data.role).toBe(user.role);
    expect(result.data.fullName).toBe(user.fullName);
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────

  it('throws UnauthorizedException when user is not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: faker.internet.email(), password: faker.internet.password() }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────

  it('throws UnauthorizedException for inactive user (indistinguishable from not found)', async () => {
    // Security: the error message must be identical to prevent user enumeration
    const inactiveUser = fakeUser({ isActive: false });
    userRepo.findByEmail.mockResolvedValue(inactiveUser);

    const error = await useCase
      .execute({ email: inactiveUser.email, password: faker.internet.password() })
      .catch((e: Error) => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).message).toBe('Credenciales inválidas.');
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────

  it('throws UnauthorizedException when password does not match', async () => {
    const user = fakeUser();
    userRepo.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      useCase.execute({ email: user.email, password: 'wrong_password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────

  it('creates session with ~30-day expiry', async () => {
    const user = fakeUser();
    userRepo.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await useCase.execute({ email: user.email, password: 'any' });

    const [sessionData] = sessionRepo.create.mock.calls[0] as [{ expirationAt: Date }];
    const thirtyDaysMs  = 30 * 24 * 60 * 60 * 1000;
    const deltaMs       = sessionData.expirationAt.getTime() - Date.now();

    // Allow ±5 s tolerance for test execution time
    expect(deltaMs).toBeGreaterThan(thirtyDaysMs - 5_000);
    expect(deltaMs).toBeLessThanOrEqual(thirtyDaysMs + 5_000);
  });

  // ── Test 6 ────────────────────────────────────────────────────────────────

  it('signs JWT with correct payload (sub, email, role, fullName, sessionUuid)', async () => {
    const user = fakeUser();
    userRepo.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await useCase.execute({ email: user.email, password: 'any' });

    const [payload] = jwtService.sign.mock.calls[0] as [Record<string, unknown>];
    expect(payload.sub).toBe(user.userId);
    expect(payload.email).toBe(user.email);
    expect(payload.role).toBe(user.role);
    expect(payload.fullName).toBe(user.fullName);
    expect(typeof payload.sessionUuid).toBe('string');
  });
});
