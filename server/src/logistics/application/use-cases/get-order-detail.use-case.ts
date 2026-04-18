import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

export interface ContractRouteInfo {
  contractRouteId: number;
  routeId: number;
  origin: string;
  destination: string;
  estimatedHours: number;
}

export interface OrderDetailOutput {
  orderId: number;
  orderNumber: string;
  status: OrderStatus;
  requestedAt: Date;
  scheduledPickupAt: Date | null;
  origin: string | null;
  destination: string | null;
  declaredWeightTon: number;
  cargoType: string;
  requiresRefrigeration: boolean;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string;
  clientAddress: string;
  contractRoutes: ContractRouteInfo[];
  assignedUnit?: {
    unitId: number;
    plate: string;
    vehicleType: string;
    pilotName: string | null;
  };
}

@Injectable()
export class GetOrderDetailUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(orderId: number): Promise<OrderDetailOutput> {
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
      .where('o.orderId = :orderId', { orderId })
      .getOne();

    if (!order) {
      throw new NotFoundException(`Orden ${orderId} no encontrada.`);
    }

    const contractRoutes: ContractRouteInfo[] = (
      order.contract?.contractRoutes ?? []
    ).map((cr) => ({
      contractRouteId: cr.contractRouteId,
      routeId: cr.routeId,
      origin: cr.route?.origin ?? '',
      destination: cr.route?.destination ?? '',
      estimatedHours: Number(cr.route?.estimatedHours ?? 0),
    }));

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      requestedAt: order.requestedAt,
      scheduledPickupAt: order.scheduledPickupAt ?? null,
      origin: order.origin,
      destination: order.destination,
      declaredWeightTon: Number(order.declaredWeightTon),
      cargoType: order.cargoType?.cargoName ?? '',
      requiresRefrigeration: order.cargoType?.requiresRefrigeration ?? false,
      clientName: order.contract?.client?.legalName ?? '',
      clientPhone: order.contract?.client?.primaryContactPhone ?? null,
      clientEmail: order.contract?.client?.primaryContactEmail ?? '',
      clientAddress: order.contract?.client?.taxAddress ?? '',
      contractRoutes,
      assignedUnit: order.unit
        ? {
            unitId: order.unit.unitId,
            plate: order.unit.plateNumber,
            vehicleType: order.unit.vehicleType?.typeName ?? '',
            pilotName: order.unit.pilotUser?.fullName ?? null,
          }
        : undefined,
    };
  }
}
