import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../../infrastructure/database/typeorm/entities/transport-unit.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';

export interface LogOutput {
    logId: string;
    eventType: RouteEventType;
    eventTime: string;
    description: string;
}

export interface GetOrderOutput {
    orderId: string;
    orderNumber: string;
    origin: string;
    destination: string;
    status: OrderStatus;
    clientName: string;
    pilotName: string;
    estimatedHours: number;
    declaredWeightTon: number;
    cargoType: string;
    scheduledPickupAt: string | null;
    dispatchedAt: string | null;
    deliveredAt: string | null;
    logs: LogOutput[];
}

@Injectable()
export class GetOrderUseCase {
    constructor(private readonly dataSource: DataSource) {}

    async execute(orderId: string, pilotUserId: string): Promise<GetOrderOutput> {
        // 1. Verificar que el piloto tiene una unidad activa
        const unit = await this.dataSource
        .getRepository(TransportUnit)
        .findOne({
            where: { pilotUserId, isActive: true },
            relations: ['pilotUser'],
        });

        if (!unit) {
        throw new ForbiddenException('No tienes una unidad de transporte asignada.');
        }

        // 2. Cargar la orden con todas las relaciones necesarias
        const order = await this.dataSource
        .getRepository(Order)
        .findOne({
            where: { orderId },
            relations: [
            'contract',
            'contract.client',
            'cargoType',
            'logs',
            'contractRoute',
            'contractRoute.route',
            ],
            order: { logs: { eventTime: 'ASC' } },
        });

        if (!order) {
            throw new NotFoundException(`Orden ${orderId} no encontrada.`);
        }

        // 3. Validar que la orden pertenece a la unidad del piloto
        if (order.unitId !== unit.unitId) {
            throw new ForbiddenException('No tienes acceso a esta orden.');
        }

        // 4. Calcular horas estimadas desde la ruta del contrato
        const estimatedHours = order.contractRoute?.route?.estimatedHours
            ? Number(order.contractRoute.route.estimatedHours)
            : order.contractRoute?.promisedDeliveryHours
            ? Number(order.contractRoute.promisedDeliveryHours)
            : 0;

        return {
            orderId:           order.orderId,
            orderNumber:       order.orderNumber,
            origin:            order.origin ?? order.pickupAddress,
            destination:       order.destination ?? order.deliveryAddress,
            status:            order.status,
            clientName:        order.contract?.client?.legalName ?? '—',
            pilotName:         unit.pilotUser?.fullName ?? '—',
            estimatedHours,
            declaredWeightTon: Number(order.declaredWeightTon),
            cargoType:         order.cargoType?.cargoName ?? '—',
            scheduledPickupAt: order.scheduledPickupAt?.toISOString() ?? null,
            dispatchedAt:      order.dispatchedAt?.toISOString() ?? null,
            deliveredAt:       order.deliveredAt?.toISOString() ?? null,
            logs: (order.logs ?? []).map((log) => ({
                logId:       log.logId,
                eventType:   log.eventType,
                eventTime:   log.eventTime.toISOString(),
                description: log.description,
            })),
        };
    }
}