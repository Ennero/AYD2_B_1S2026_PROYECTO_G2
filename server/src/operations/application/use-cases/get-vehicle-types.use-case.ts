import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { VehicleType } from '../../../infrastructure/database/typeorm/entities/vehicle-type.entity';

@Injectable()
export class GetVehicleTypesUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<VehicleType[]> {
    return this.dataSource.getRepository(VehicleType).find({
      order: { vehicleTypeId: 'ASC' },
    });
  }
}
