import { Injectable } from '@nestjs/common';
import { DataSource, Between, ILike, FindOptionsWhere } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../../infrastructure/database/typeorm/entities/transport-unit.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

export interface ListOrdersFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  clientName?: string;
  origin?: string;
  destination?: string;
  cargoType?: string;
  sortByWeight?: 'ASC' | 'DESC';
}

export interface ListOrdersOutput {
  orderId: number;
  orderNumber: string;
  origin: string;
  destination: string;
  status: OrderStatus;
  clientName: string;
  cargoType: string;
  declaredWeightTon: number;
  scheduledPickupAt: string | null;
}

@Injectable()
export class ListOrdersUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    pilotUserId: number,
    filters: ListOrdersFilters = {},
  ): Promise<ListOrdersOutput[]> {
    // 1. Buscar la unidad del piloto
    const unit = await this.dataSource
      .getRepository(TransportUnit)
      .findOne({ where: { pilotUserId, isActive: true } });

    if (!unit) return [];

    // 2. Construir where dinámico
    const where: FindOptionsWhere<Order> = { unitId: unit.unitId };

    // Filtro por estado
    if (
      filters.status &&
      Object.values(OrderStatus).includes(filters.status as OrderStatus)
    ) {
      where.status = filters.status as OrderStatus;
    }

    // Filtro por rango de fechas (scheduledPickupAt)
    if (filters.startDate && filters.endDate) {
      where.scheduledPickupAt = Between(
        new Date(filters.startDate),
        new Date(filters.endDate + 'T23:59:59Z'),
      );
    } else if (filters.startDate) {
      where.scheduledPickupAt = Between(
        new Date(filters.startDate),
        new Date('2099-12-31'),
      );
    } else if (filters.endDate) {
      where.scheduledPickupAt = Between(
        new Date('2000-01-01'),
        new Date(filters.endDate + 'T23:59:59Z'),
      );
    }

    // Filtro por origen/destino (búsqueda parcial)
    if (filters.origin) {
      where.origin = ILike(`%${filters.origin}%`);
    }
    if (filters.destination) {
      where.destination = ILike(`%${filters.destination}%`);
    }

    // 3. Ordenación por peso
    const orderBy: any = filters.sortByWeight
      ? { declaredWeightTon: filters.sortByWeight }
      : { requestedAt: 'DESC' };

    // 4. Ejecutar query con relaciones
    const orders = await this.dataSource.getRepository(Order).find({
      where,
      relations: ['contract', 'contract.client', 'cargoType'],
      order: orderBy,
    });

    // 5. Filtro por clientName y cargoType en memoria
    // (ILike sobre relaciones requeriría QueryBuilder — más simple en memoria)
    let result = orders;

    if (filters.clientName) {
      const search = filters.clientName.toLowerCase();
      result = result.filter((o) =>
        o.contract?.client?.legalName?.toLowerCase().includes(search),
      );
    }

    if (filters.cargoType) {
      const search = filters.cargoType.toLowerCase();
      result = result.filter((o) =>
        o.cargoType?.cargoName?.toLowerCase().includes(search),
      );
    }

    return result.map((order) => ({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      origin: order.origin ?? order.pickupAddress,
      destination: order.destination ?? order.deliveryAddress,
      status: order.status,
      clientName: order.contract?.client?.legalName ?? '—',
      cargoType: order.cargoType?.cargoName ?? '—',
      declaredWeightTon: Number(order.declaredWeightTon),
      scheduledPickupAt: order.scheduledPickupAt
        ? order.scheduledPickupAt.toISOString()
        : null,
    }));
  }
}
