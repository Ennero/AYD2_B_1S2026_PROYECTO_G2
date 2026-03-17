import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';

@Injectable()
export class FormalizeCargaUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(orderId: string, loadedWeightTon: number, stowageConfirmed: boolean, userFullName: string): Promise<any> {
    if (!stowageConfirmed) {
      throw new BadRequestException('La estiba debe ser validada para formalizar la carga.');
    }

    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.findOneBy({ orderId });

      if (!order) {
        throw new NotFoundException(`Orden ${orderId} no encontrada.`);
      }

      if (!order.unitId) {
        throw new BadRequestException(
          `La orden ${order.orderNumber} no tiene una unidad asignada (unit_id).`,
        );
      }

      if (order.status === OrderStatus.LISTA_PARA_DESPACHO) {
        throw new BadRequestException(`La orden ${order.orderNumber} ya está formalizada y lista para despacho.`);
      }

      // Update order details
      order.loadedWeightTon = loadedWeightTon;
      order.stowageConfirmed = stowageConfirmed;
      order.status = OrderStatus.LISTA_PARA_DESPACHO;
      
      await orderRepo.save(order);

      // Log the event
      const logRepo = manager.getRepository(OrderRouteLog);
      const log = logRepo.create({
        orderId: order.orderId,
        eventType: RouteEventType.OTRO,
        description: `Carga formalizada por el Encargado de Patio: ${userFullName}. Peso registrado: ${loadedWeightTon} ton.`,
        eventTime: new Date(),
      });
      await logRepo.save(log);

      return {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        status: order.status,
      };
    });
  }
}
