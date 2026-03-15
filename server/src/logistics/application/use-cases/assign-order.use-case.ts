import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

export interface AssignOrderInput {
  orderId: string;
  contractRouteId: string;
  binomialId: string;
  scheduledDeparture: string;
}

export interface AssignOrderOutput {
  orderId: string;
  status: OrderStatus;
  unitId: string;
  scheduledPickupAt: Date;
}

@Injectable()
export class AssignOrderUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(input: AssignOrderInput): Promise<AssignOrderOutput> {
    // Parsear unitId desde el binomialId "unit:<uuid>"
    const unitId = input.binomialId.startsWith('unit:')
      ? input.binomialId.slice(5)
      : input.binomialId;

    const orderRepo = this.dataSource.getRepository(Order);

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

    return {
      orderId: saved.orderId,
      status: saved.status,
      unitId: saved.unitId!,
      scheduledPickupAt: saved.scheduledPickupAt!,
    };
  }
}
