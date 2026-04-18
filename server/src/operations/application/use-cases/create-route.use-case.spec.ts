/**
 * Unit tests for CreateRouteUseCase
 *
 * Las rutas de transporte se crean con código, origen y destino
 * normalizados a MAYÚSCULAS y sin espacios innecesarios.
 * El código de ruta es el identificador único: si ya existe se lanza ConflictException.
 *
 * Escenarios cubiertos:
 *   1. Crea la ruta con código, origen y destino en MAYÚSCULAS.
 *   2. Elimina espacios al inicio/fin de código, origen y destino.
 *   3. Lanza ConflictException cuando ya existe una ruta con el mismo código.
 *   4. La detección de duplicado usa el código normalizado.
 *   5. Persiste distanceKm, estimatedHours e isInternational correctamente.
 *
 * Run: npm run test:unit
 * Run this file only: npm run test:unit -- create-route.use-case
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { CreateRouteUseCase } from './create-route.use-case';
import { Route } from '../../../infrastructure/database/typeorm/entities/route.entity';

// ── Factory ───────────────────────────────────────────────────────────────────

function fakeRoute(overrides: Record<string, unknown> = {}): Partial<Route> {
  return {
    routeId: faker.number.int({ min: 1, max: 999 }),
    routeCode: `RT-${faker.string.alphanumeric(4).toUpperCase()}`,
    origin: faker.location.city().toUpperCase(),
    destination: faker.location.city().toUpperCase(),
    distanceKm: faker.number.float({ min: 10, max: 5000, fractionDigits: 1 }),
    estimatedHours: faker.number.float({ min: 1, max: 72, fractionDigits: 1 }),
    isInternational: false,
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('CreateRouteUseCase', () => {
  let useCase: CreateRouteUseCase;
  let mockRouteRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let mockDataSource: { getRepository: jest.Mock };

  beforeEach(async () => {
    mockRouteRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRouteRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRouteUseCase,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    useCase = module.get(CreateRouteUseCase);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── Test 1 ────────────────────────────────────────────────────────────────

  it('crea la ruta con código, origen y destino en MAYÚSCULAS', async () => {
    const saved = fakeRoute({
      routeCode: 'GT-MX-001',
      origin: 'GUATEMALA CITY',
      destination: 'CIUDAD DE MEXICO',
    });
    mockRouteRepo.findOne.mockResolvedValue(null);
    mockRouteRepo.create.mockReturnValue(saved);
    mockRouteRepo.save.mockResolvedValue(saved);

    await useCase.execute({
      routeCode: 'gt-mx-001',
      origin: 'guatemala city',
      destination: 'ciudad de mexico',
      distanceKm: 1200,
      estimatedHours: 16,
      isInternational: true,
    });

    expect(mockRouteRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        routeCode: 'GT-MX-001',
        origin: 'GUATEMALA CITY',
        destination: 'CIUDAD DE MEXICO',
      }),
    );
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────

  it('elimina espacios al inicio y fin del código de ruta', async () => {
    const saved = fakeRoute({ routeCode: 'RT-100' });
    mockRouteRepo.findOne.mockResolvedValue(null);
    mockRouteRepo.create.mockReturnValue(saved);
    mockRouteRepo.save.mockResolvedValue(saved);

    await useCase.execute({
      routeCode: '  RT-100  ',
      origin: 'CIUDAD',
      destination: 'OTRA CIUDAD',
      distanceKm: 300,
      estimatedHours: 5,
      isInternational: false,
    });

    // La búsqueda de duplicados y la creación usan el código sin espacios
    expect(mockRouteRepo.findOne).toHaveBeenCalledWith({
      where: { routeCode: 'RT-100' },
    });
    expect(mockRouteRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ routeCode: 'RT-100' }),
    );
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────

  it('lanza ConflictException cuando ya existe una ruta con el mismo código', async () => {
    const existing = fakeRoute({ routeCode: 'GT-SV-001' });
    mockRouteRepo.findOne.mockResolvedValue(existing);

    await expect(
      useCase.execute({
        routeCode: 'GT-SV-001',
        origin: 'GUATEMALA',
        destination: 'EL SALVADOR',
        distanceKm: 200,
        estimatedHours: 3,
        isInternational: true,
      }),
    ).rejects.toThrow(ConflictException);

    expect(mockRouteRepo.save).not.toHaveBeenCalled();
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────

  it('detecta duplicado comparando el código normalizado a MAYÚSCULAS', async () => {
    const existing = fakeRoute({ routeCode: 'GT-HN-002' });
    mockRouteRepo.findOne.mockResolvedValue(existing);

    // El usuario escribe en minúsculas pero debe detectarse como duplicado
    await expect(
      useCase.execute({
        routeCode: 'gt-hn-002',
        origin: 'guatemala',
        destination: 'honduras',
        distanceKm: 350,
        estimatedHours: 5,
        isInternational: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────

  it('persiste distanceKm, estimatedHours e isInternational correctamente', async () => {
    const saved = fakeRoute({
      distanceKm: 450.5,
      estimatedHours: 6.5,
      isInternational: true,
    });
    mockRouteRepo.findOne.mockResolvedValue(null);
    mockRouteRepo.create.mockReturnValue(saved);
    mockRouteRepo.save.mockResolvedValue(saved);

    const result = await useCase.execute({
      routeCode: 'RT-NEW-01',
      origin: 'CIUDAD A',
      destination: 'CIUDAD B',
      distanceKm: 450.5,
      estimatedHours: 6.5,
      isInternational: true,
    });

    expect(mockRouteRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        distanceKm: 450.5,
        estimatedHours: 6.5,
        isInternational: true,
      }),
    );
    expect(result.isInternational).toBe(true);
  });
});
