import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CargoType } from '../../../infrastructure/database/typeorm/entities/cargo-type.entity';

export interface CargoTypeItem {
  cargoTypeId: number;
  cargoName: string;
  requiresRefrigeration: boolean;
}

@Injectable()
export class GetCargoTypesUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<CargoTypeItem[]> {
    const cargoTypes = await this.dataSource
      .getRepository(CargoType)
      .createQueryBuilder('ct')
      .orderBy('ct.cargoName', 'ASC')
      .getMany();

    return cargoTypes.map((cargoType) => ({
      cargoTypeId: cargoType.cargoTypeId,
      cargoName: cargoType.cargoName,
      requiresRefrigeration: cargoType.requiresRefrigeration,
    }));
  }
}
