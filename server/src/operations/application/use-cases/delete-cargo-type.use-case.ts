import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CargoType } from '../../../infrastructure/database/typeorm/entities/cargo-type.entity';
import { Contract } from '../../../infrastructure/database/typeorm/entities/contract.entity';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';

@Injectable()
export class DeleteCargoTypeUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    cargoTypeId: number,
  ): Promise<{ cargoTypeId: number; cargoName: string }> {
    const cargoRepo = this.dataSource.getRepository(CargoType);

    const cargoType = await cargoRepo.findOne({ where: { cargoTypeId } });
    if (!cargoType) {
      throw new NotFoundException(
        `No existe el tipo de carga con ID ${cargoTypeId}.`,
      );
    }

    const contractsUsingCargo = await this.dataSource
      .getRepository(Contract)
      .createQueryBuilder('contract')
      .innerJoin(
        'contract.cargoTypes',
        'cargoType',
        'cargoType.cargoTypeId = :cargoTypeId',
        {
          cargoTypeId,
        },
      )
      .getCount();

    const ordersUsingCargo = await this.dataSource.getRepository(Order).count({
      where: { cargoTypeId },
    });

    if (contractsUsingCargo > 0 || ordersUsingCargo > 0) {
      throw new ConflictException(
        `No se puede eliminar ${cargoType.cargoName} porque está asociado a contratos u órdenes existentes.`,
      );
    }

    await cargoRepo.remove(cargoType);

    return {
      cargoTypeId,
      cargoName: cargoType.cargoName,
    };
  }
}
