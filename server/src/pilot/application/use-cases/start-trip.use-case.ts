import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../../infrastructure/database/typeorm/entities/transport-unit.entity';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';
import { EmailService } from '../../../notifications/email/application/email.service';

export interface StartTripOutput {
  orderId: number;
  status: OrderStatus;
  dispatchedAt: string;
}

@Injectable()
export class StartTripUseCase {
  private readonly logger = new Logger(StartTripUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    orderId: number,
    pilotUserId: number,
  ): Promise<StartTripOutput> {
    // 1. Verificar unidad del piloto
    const unit = await this.dataSource
      .getRepository(TransportUnit)
      .findOne({ where: { pilotUserId, isActive: true } });

    if (!unit) {
      throw new ForbiddenException(
        'No tienes una unidad de transporte asignada.',
      );
    }

    return this.dataSource.transaction(async (em) => {
      const orderRepo = em.getRepository(Order);
      const order = await orderRepo.findOne({
        where: { orderId },
        relations: { contract: { client: true }, cargoType: true, unit: true },
      });

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

      const clientEmail = order.contract?.client?.primaryContactEmail;
      const clientName = order.contract?.client?.primaryContactName;

      if (clientEmail && clientName) {
        this.emailService
          .sendOrderDispatched({
            to: clientEmail,
            clientName,
            orderNumber: order.orderNumber,
            origin: order.origin ?? order.pickupAddress,
            destination: order.destination ?? order.deliveryAddress,
            dispatchedAt: dispatchedAt.toLocaleString('es-GT'),
            cargoType: order.cargoType?.cargoName ?? undefined,
            unitPlate: order.unit?.plateNumber ?? undefined,
          })
          .catch((err: Error) =>
            this.logger.error(
              `Error al enviar email de salida para ${order.orderNumber}: ${err.message}`,
            ),
          );
      } else {
        this.logger.warn(
          `No se envió email de salida para ${order.orderNumber} por falta de correo/contacto del cliente.`,
        );
      }

      return {
        orderId: order.orderId,
        status: order.status,
        dispatchedAt: dispatchedAt.toISOString(),
      };
    });
  }
}
