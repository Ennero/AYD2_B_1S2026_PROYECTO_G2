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

    const selectedUnit = await unitRepo.findOne({ where: { unitId } });
    if (!selectedUnit) {
      throw new NotFoundException(`Unidad ${unitId} no encontrada.`);
    }

    if (!selectedUnit.pilotUserId) {
      throw new BadRequestException(
        'La unidad seleccionada no tiene piloto asignado.',
      );
    }

    const pilotActiveOrdersCount = await orderRepo
      .createQueryBuilder('order')
      .innerJoin('order.unit', 'unit')
      .where('unit.pilot_user_id = :pilotUserId', {
        pilotUserId: selectedUnit.pilotUserId,
      })
      .andWhere('order.order_id != :currentOrderId', {
        currentOrderId: order.orderId,
      })
      .andWhere('order.status IN (:...activeStatuses)', {
        activeStatuses: [
          OrderStatus.ASIGNADA,
          OrderStatus.LISTA_PARA_DESPACHO,
          OrderStatus.EN_TRANSITO,
          OrderStatus.BLOQUEADA,
        ],
      })
      .getCount();

    if (pilotActiveOrdersCount > 0) {
      throw new BadRequestException(
        'El piloto del binomio seleccionado ya tiene una carga activa asignada.',
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
