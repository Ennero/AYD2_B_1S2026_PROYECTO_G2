import { Injectable, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CargoType } from '../../../infrastructure/database/typeorm/entities/cargo-type.entity';

@Injectable()
export class CreateCargoTypeUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    cargoName: string,
    requiresRefrigeration: boolean,
  ): Promise<CargoType> {
    const cargoRepo = this.dataSource.getRepository(CargoType);

    const nameUpper = cargoName.toUpperCase().trim();

    const existing = await cargoRepo.findOne({
      where: { cargoName: nameUpper },
    });
    if (existing) {
      throw new ConflictException(
        `El tipo de carga ${nameUpper} ya existe en el catálogo.`,
      );
    }

    const newCargo = cargoRepo.create({
      cargoName: nameUpper,
      requiresRefrigeration,
    });

    return await cargoRepo.save(newCargo);
  }
}
