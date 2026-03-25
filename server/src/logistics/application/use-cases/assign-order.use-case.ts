import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../../infrastructure/database/typeorm/entities/transport-unit.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

export interface AssignOrderInput {
  orderId: number;
  contractRouteId: number;
  binomialId: string;
  scheduledDeparture: string;
}

export interface AssignOrderOutput {
  orderId: number;
  status: OrderStatus;
  unitId: number;
  scheduledPickupAt: Date;
}

@Injectable()
export class AssignOrderUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(input: AssignOrderInput): Promise<AssignOrderOutput> {
    // Parsear unitId desde el binomialId "unit:<id>"
    const unitIdStr = input.binomialId.startsWith('unit:')
      ? input.binomialId.slice(5)
      : input.binomialId;
    const unitId = parseInt(unitIdStr, 10);

    const orderRepo = this.dataSource.getRepository(Order);
    const unitRepo = this.dataSource.getRepository(TransportUnit);

    const order = await orderRepo.findOne({
      where: { orderId: input.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Orden ${input.orderId} no encontrada.`);
    }

    if (order.status !== OrderStatus.REGISTRADA) {
      throw new BadRequestException(
        `La orden ya fue procesada. Estado actual: ${order.status}.`,
      );
    }

    // Asignar campos — el trigger VALIDATE_ORDER_ASSIGNMENT valida
    // capacidad, refrigeración, licencias y calcula montos automáticamente.
    order.unitId = unitId;
    order.contractRouteId = input.contractRouteId;
    order.scheduledPickupAt = new Date(input.scheduledDeparture);
    order.status = OrderStatus.ASIGNADA;

    // save() genera un UPDATE que activa los triggers de la DB
    const saved = await orderRepo.save(order);

    // Marcar unidad como no disponible
    await unitRepo.update(unitId, { isAvailable: false });

    return {
      orderId: saved.orderId,
      status: saved.status,
      unitId: saved.unitId!,
      scheduledPickupAt: saved.scheduledPickupAt!,
    };
  }
}
