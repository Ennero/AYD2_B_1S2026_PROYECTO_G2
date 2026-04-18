/**
 * Unit tests for CreateCargoTypeUseCase
 *
 * Un tipo de carga se crea con nombre normalizado a mayúsculas.
 * Si ya existe otro con el mismo nombre (normalizado) se lanza ConflictException.
 *
 * Escenarios cubiertos:
 *   1. Crea el tipo de carga con nombre en MAYÚSCULAS.
 *   2. Normaliza nombres con espacios al inicio/fin antes de guardar.
 *   3. Lanza ConflictException cuando ya existe un tipo con el mismo nombre.
 *   4. La verificación de duplicado usa el nombre normalizado a mayúsculas.
 *   5. Guarda el flag requiresRefrigeration correctamente.
 *
 * Run: npm run test:unit
 * Run this file only: npm run test:unit -- create-cargo-type.use-case
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { CreateCargoTypeUseCase } from './create-cargo-type.use-case';
import { CargoType } from '../../../infrastructure/database/typeorm/entities/cargo-type.entity';

// ── Factory ───────────────────────────────────────────────────────────────────

function fakeCargoType(
  overrides: Record<string, unknown> = {},
): Partial<CargoType> {
  return {
    cargoTypeId: faker.number.int({ min: 1, max: 999 }),
    cargoName: faker.commerce.productName().toUpperCase(),
    requiresRefrigeration: false,
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('CreateCargoTypeUseCase', () => {
  let useCase: CreateCargoTypeUseCase;
  let mockCargoRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let mockDataSource: { getRepository: jest.Mock };

  beforeEach(async () => {
    mockCargoRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockCargoRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCargoTypeUseCase,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    useCase = module.get(CreateCargoTypeUseCase);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── Test 1 ────────────────────────────────────────────────────────────────

  it('crea el tipo de carga con nombre convertido a MAYÚSCULAS', async () => {
    const name = 'carga líquida';
    const saved = fakeCargoType({ cargoName: name.toUpperCase().trim() });
    mockCargoRepo.findOne.mockResolvedValue(null); // no existe
    mockCargoRepo.create.mockReturnValue(saved);
    mockCargoRepo.save.mockResolvedValue(saved);

    const result = await useCase.execute(name, false);

    expect(result.cargoName).toBe('CARGA LÍQUIDA');
    // El repositorio debe buscar con el nombre normalizado
    expect(mockCargoRepo.findOne).toHaveBeenCalledWith({
      where: { cargoName: 'CARGA LÍQUIDA' },
    });
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────

  it('elimina espacios al inicio y fin del nombre antes de guardar', async () => {
    const nameWithSpaces = '  CARGA SECA  ';
    const saved = fakeCargoType({ cargoName: 'CARGA SECA' });
    mockCargoRepo.findOne.mockResolvedValue(null);
    mockCargoRepo.create.mockReturnValue(saved);
    mockCargoRepo.save.mockResolvedValue(saved);

    await useCase.execute(nameWithSpaces, false);

    // La búsqueda de duplicados usa el nombre sin espacios
    expect(mockCargoRepo.findOne).toHaveBeenCalledWith({
      where: { cargoName: 'CARGA SECA' },
    });
    // El objeto creado también tiene el nombre limpio
    expect(mockCargoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ cargoName: 'CARGA SECA' }),
    );
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────

  it('lanza ConflictException cuando ya existe un tipo con el mismo nombre', async () => {
    const existing = fakeCargoType({ cargoName: 'ELECTRODOMÉSTICOS' });
    mockCargoRepo.findOne.mockResolvedValue(existing);

    await expect(useCase.execute('Electrodomésticos', false)).rejects.toThrow(
      ConflictException,
    );

    // save nunca se llama si ya existe
    expect(mockCargoRepo.save).not.toHaveBeenCalled();
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────

  it('compara el nombre normalizado al detectar duplicados (minúsculas → mayúsculas)', async () => {
    const existing = fakeCargoType({ cargoName: 'PERECEDEROS' });
    mockCargoRepo.findOne.mockResolvedValue(existing);

    // El usuario escribe en minúsculas pero debe detectarse como duplicado
    await expect(useCase.execute('perecederos', false)).rejects.toThrow(
      ConflictException,
    );
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────

  it('guarda requiresRefrigeration = true cuando se indica que requiere refrigeración', async () => {
    const saved = fakeCargoType({
      cargoName: 'ALIMENTOS FRESCOS',
      requiresRefrigeration: true,
    });
    mockCargoRepo.findOne.mockResolvedValue(null);
    mockCargoRepo.create.mockReturnValue(saved);
    mockCargoRepo.save.mockResolvedValue(saved);

    const result = await useCase.execute('Alimentos Frescos', true);

    expect(result.requiresRefrigeration).toBe(true);
    expect(mockCargoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ requiresRefrigeration: true }),
    );
  });
});
