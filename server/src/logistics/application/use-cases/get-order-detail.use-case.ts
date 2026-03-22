import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';

@Injectable()
export class GetOrderDetailUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(orderId: number): Promise<Order> {
    const order = await this.dataSource
      .getRepository(Order)
      .createQueryBuilder('o')
      .innerJoinAndSelect('o.contract', 'ct')
      .innerJoinAndSelect('ct.client', 'c')
      .leftJoinAndSelect('ct.contractRoutes', 'ctRoutes')
      .leftJoinAndSelect('ctRoutes.route', 'ctRoute')
      .innerJoinAndSelect('o.cargoType', 'cargo')
      .leftJoinAndSelect('o.unit', 'unit')
      .leftJoinAndSelect('unit.vehicleType', 'vt')
      .leftJoinAndSelect('unit.pilotUser', 'pilot')
      .leftJoinAndSelect('o.contractRoute', 'cr')
      .leftJoinAndSelect('cr.route', 'route')
      .where('o.orderId = :orderId', { orderId })
      .getOne();

    if (!order) {
      throw new NotFoundException(`Orden ${orderId} no encontrada.`);
    }

    return order;
  }
}
