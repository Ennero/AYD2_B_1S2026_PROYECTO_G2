import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CargoType } from '../../../infrastructure/database/typeorm/entities/cargo-type.entity';

@Injectable()
export class UpdateCargoTypeUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    cargoTypeId: number,
    input: { cargoName: string; requiresRefrigeration: boolean },
  ): Promise<CargoType> {
    const cargoRepo = this.dataSource.getRepository(CargoType);

    const cargoType = await cargoRepo.findOne({ where: { cargoTypeId } });
    if (!cargoType) {
      throw new NotFoundException(`No existe el tipo de carga con ID ${cargoTypeId}.`);
    }

    const normalizedName = input.cargoName.toUpperCase().trim();

    const existingWithSameName = await cargoRepo
      .createQueryBuilder('cargo')
      .where('cargo.cargo_name = :normalizedName', { normalizedName })
      .andWhere('cargo.cargo_type_id != :cargoTypeId', { cargoTypeId })
      .getOne();

    if (existingWithSameName) {
      throw new ConflictException(`El tipo de carga ${normalizedName} ya existe en el catálogo.`);
    }

    cargoType.cargoName = normalizedName;
    cargoType.requiresRefrigeration = input.requiresRefrigeration;

    return await cargoRepo.save(cargoType);
  }
}
