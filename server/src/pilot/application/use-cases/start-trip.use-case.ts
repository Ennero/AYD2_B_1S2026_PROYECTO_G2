import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../../infrastructure/database/typeorm/entities/transport-unit.entity';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';

export interface StartTripOutput {
    orderId: number;
    status: OrderStatus;
    dispatchedAt: string;
}

@Injectable()
export class StartTripUseCase {
    constructor(private readonly dataSource: DataSource) {}

    async execute(orderId: number, pilotUserId: number): Promise<StartTripOutput> {
        // 1. Verificar unidad del piloto
        const unit = await this.dataSource
        .getRepository(TransportUnit)
        .findOne({ where: { pilotUserId, isActive: true } });

        if (!unit) {
        throw new ForbiddenException('No tienes una unidad de transporte asignada.');
        }

        return this.dataSource.transaction(async (em) => {
        const orderRepo = em.getRepository(Order);
        const order = await orderRepo.findOneBy({ orderId });

        if (!order) {
            throw new NotFoundException(`Orden ${orderId} no encontrada.`);
        }

        // 2. Validar que la orden pertenece al piloto
        if (order.unitId !== unit.unitId) {
            throw new ForbiddenException('No tienes acceso a esta orden.');
        }

        // 3. Validar transición de estado — solo desde LISTA_PARA_DESPACHO
        if (order.status !== OrderStatus.LISTA_PARA_DESPACHO) {
            throw new BadRequestException(
            `La orden ${order.orderNumber} debe estar en LISTA_PARA_DESPACHO para iniciar el viaje. Estado actual: ${order.status}.`,
            );
        }

        // 4. Actualizar estado y registrar DISPATCHED_AT
        const dispatchedAt = new Date();
        order.status = OrderStatus.EN_TRANSITO;
        order.dispatchedAt = dispatchedAt;
        await orderRepo.save(order);

        // 5. Registrar evento en bitácora
        const logRepo = em.getRepository(OrderRouteLog);
        const log = logRepo.create({
            orderId: order.orderId,
            eventType: RouteEventType.SALIDA,
            description: 'Piloto inició el viaje. Estado cambiado a EN_TRANSITO.',
            eventTime: dispatchedAt,
        });
        await logRepo.save(log);

        return {
            orderId:     order.orderId,
            status:      order.status,
            dispatchedAt: dispatchedAt.toISOString(),
        };
        });
    }
}