import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../infrastructure/database/typeorm/entities/transport-unit.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';

export interface ListOrdersOutput {
    orderId: string;
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

    async execute(pilotUserId: string): Promise<ListOrdersOutput[]> {
        // 1. Buscar la unidad de transporte asignada al piloto
        const unit = await this.dataSource
        .getRepository(TransportUnit)
        .findOne({ where: { pilotUserId, isActive: true } });

        if (!unit) return [];

        // 2. Buscar órdenes asignadas a esa unidad con sus relaciones
        const orders = await this.dataSource
        .getRepository(Order)
        .find({
            where: { unitId: unit.unitId },
            relations: ['contract', 'contract.client', 'cargoType'],
            order: { requestedAt: 'DESC' },
    });

    return orders.map((order) => ({
            orderId:           order.orderId,
            orderNumber:       order.orderNumber,
            origin:            order.origin ?? order.pickupAddress,
            destination:       order.destination ?? order.deliveryAddress,
            status:            order.status,
            clientName:        order.contract?.client?.legalName ?? '—',
            cargoType:         order.cargoType?.cargoName ?? '—',
            declaredWeightTon: Number(order.declaredWeightTon),
            scheduledPickupAt: order.scheduledPickupAt
                ? order.scheduledPickupAt.toISOString()
                : null,
        }));
    }
}