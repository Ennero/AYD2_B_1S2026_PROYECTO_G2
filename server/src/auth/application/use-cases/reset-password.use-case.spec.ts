/**
 * Unit tests for ResetPasswordUseCase
 *
 * Permite a un usuario cambiar su contraseña usando el token de un link
 * enviado al correo.  Incluye varias validaciones de seguridad:
 *   - Password y confirmación deben coincidir.
 *   - Token de recuperación no puede estar vacío.
 *   - Token debe existir en BD y no estar expirado.
 *   - Nueva contraseña no puede ser igual a la actual.
 *
 * En todos los casos de error se lanza BadRequestException o
 * UnauthorizedException según corresponda.
 *
 * Escenarios cubiertos:
 *   1. Lanza BadRequestException cuando password !== confirmation.
 *   2. Lanza UnauthorizedException cuando rawToken está vacío.
 *   3. Lanza UnauthorizedException cuando el token no existe / expiró.
 *   4. Lanza UnauthorizedException cuando el usuario no existe.
 *   5. Lanza BadRequestException cuando la nueva contraseña es igual a la actual.
 *   6. Cambia la contraseña y marca el token como usado cuando todo es válido.
 *
 * Run: npm run test:unit
 * Run this file only: npm run test:unit -- reset-password.use-case
 */

// bcrypt debe mockearse ANTES de cualquier import para que Jest lo intercepte
jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { AUTH_USER_REPOSITORY_TOKEN } from '../../domain/repositories/auth-user.repository.interface';
import { PASSWORD_RECOVERY_REPOSITORY_TOKEN } from '../../domain/repositories/password-recovery.repository.interface';

// ── Factories ─────────────────────────────────────────────────────────────────

function fakeRecoveryRecord(overrides: Record<string, unknown> = {}) {
  return {
    tokenId:   faker.number.int({ min: 1, max: 999 }),
    userId:    faker.number.int({ min: 1, max: 999 }),
    tokenHash: faker.string.hexadecimal({ length: 64 }),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    usedAt:    null,
    ...overrides,
  };
}

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    userId:       faker.number.int({ min: 1, max: 999 }),
    email:        faker.internet.email(),
    fullName:     faker.person.fullName(),
    passwordHash: faker.string.alphanumeric(60),
    isActive:     true,
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('ResetPasswordUseCase', () => {
  let useCase:      ResetPasswordUseCase;
  let userRepo:     { findById: jest.Mock; updatePassword: jest.Mock };
  let recoveryRepo: { findValidByTokenHash: jest.Mock; markAsUsed: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findById:       jest.fn(),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };

    recoveryRepo = {
      findValidByTokenHash: jest.fn(),
      markAsUsed:           jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordUseCase,
        { provide: AUTH_USER_REPOSITORY_TOKEN,        useValue: userRepo },
        { provide: PASSWORD_RECOVERY_REPOSITORY_TOKEN, useValue: recoveryRepo },
      ],
    }).compile();

    useCase = module.get(ResetPasswordUseCase);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── Test 1 ────────────────────────────────────────────────────────────────

  it('lanza BadRequestException cuando password y confirmation no coinciden', async () => {
    await expect(
      useCase.execute({
        rawToken:     faker.string.alphanumeric(64),
        password:     'Contraseña_Segura_123',
        confirmation: 'Contraseña_Diferente_456',
      }),
    ).rejects.toThrow(BadRequestException);

    // La validación falla antes de consultar la BD
    expect(recoveryRepo.findValidByTokenHash).not.toHaveBeenCalled();
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────

  it('lanza UnauthorizedException cuando rawToken está vacío', async () => {
    await expect(
      useCase.execute({
        rawToken:     '',
        password:     'MismaContraseña_123',
        confirmation: 'MismaContraseña_123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────

  it('lanza UnauthorizedException cuando el token no existe o ya expiró', async () => {
    recoveryRepo.findValidByTokenHash.mockResolvedValue(null);

    await expect(
      useCase.execute({
        rawToken:     faker.string.alphanumeric(64),
        password:     'NuevaContraseña_123',
        confirmation: 'NuevaContraseña_123',
      }),
    ).rejects.toThrow(UnauthorizedException);

    // El usuario nunca se consulta si el token ya no sirve
    expect(userRepo.findById).not.toHaveBeenCalled();
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────

  it('lanza UnauthorizedException cuando el usuario no existe en base de datos', async () => {
    const record = fakeRecoveryRecord();
    recoveryRepo.findValidByTokenHash.mockResolvedValue(record);
    userRepo.findById.mockResolvedValue(null);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      useCase.execute({
        rawToken:     faker.string.alphanumeric(64),
        password:     'NuevaContraseña_123',
        confirmation: 'NuevaContraseña_123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────

  it('lanza BadRequestException cuando la nueva contraseña es igual a la actual', async () => {
    const user   = fakeUser();
    const record = fakeRecoveryRecord({ userId: user.userId });
    recoveryRepo.findValidByTokenHash.mockResolvedValue(record);
    userRepo.findById.mockResolvedValue(user);
    // bcrypt.compare devuelve true → misma contraseña
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      useCase.execute({
        rawToken:     faker.string.alphanumeric(64),
        password:     'MismaContraseñaActual_123',
        confirmation: 'MismaContraseñaActual_123',
      }),
    ).rejects.toThrow(BadRequestException);

    // La contraseña nunca se actualiza
    expect(userRepo.updatePassword).not.toHaveBeenCalled();
  });

  // ── Test 6 ────────────────────────────────────────────────────────────────

  it('actualiza la contraseña y marca el token como usado cuando todo es válido', async () => {
    const user   = fakeUser();
    const record = fakeRecoveryRecord({ userId: user.userId });
    recoveryRepo.findValidByTokenHash.mockResolvedValue(record);
    userRepo.findById.mockResolvedValue(user);
    // bcrypt.compare devuelve false → contraseña diferente a la actual
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$nuevohash');

    await expect(
      useCase.execute({
        rawToken:     faker.string.alphanumeric(64),
        password:     'NuevaContraseñaSegura_456',
        confirmation: 'NuevaContraseñaSegura_456',
      }),
    ).resolves.toBeUndefined();

    expect(userRepo.updatePassword).toHaveBeenCalledWith(user.userId, '$2b$12$nuevohash');
    expect(recoveryRepo.markAsUsed).toHaveBeenCalledWith(record.tokenId);
  });
});
