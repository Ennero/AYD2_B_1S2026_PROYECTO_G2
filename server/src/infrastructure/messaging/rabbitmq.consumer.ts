import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventsGateway } from '../websocket/events.gateway';

interface FacturaBorradorEvent {
  invoiceId: number;
  invoiceNumber: string;
  orderId: number;
  orderNumber: string;
  clientId: number;
  clientName: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

interface FacturaEnEsperaEvent {
  invoiceId: number;
  invoiceNumber: string;
  queuedAt: string;
}

interface OrdenEntregadaEvent {
  orderId: number;
  orderNumber: string;
  clientId: number;
  totalAmount: number;
  currency: string;
  deliveredAt: string;
}

interface FacturaCertificadaEvent {
  invoiceId: number;
  invoiceNumber: string;
  clientId: number;
  totalAmount: number;
  currency: string;
  felUuid: string;
  certifiedAt: string;
}

interface FacturaRechazadaEvent {
  invoiceId: number;
  invoiceNumber: string;
  reason: string;
  rejectedAt: string;
}

interface PagoAprobadoEvent {
  paymentId: number;
  invoiceId: number;
  amount: number;
  currency: string;
  invoiceStatus: string;
  approvedAt: string;
}

@Controller()
export class RabbitmqConsumerController {
  private readonly logger = new Logger(RabbitmqConsumerController.name);

  constructor(private readonly events: EventsGateway) {}

  @EventPattern('factura.borrador')
  handleFacturaBorrador(@Payload() data: FacturaBorradorEvent): void {
    this.logger.log(
      `[factura.borrador] factura=${data.invoiceNumber} orden=${data.orderNumber} ` +
        `cliente=${data.clientName} total=${data.currency} ${data.totalAmount} creada=${data.createdAt}`,
    );
    this.events.emitFacturaBorrador(data);
  }

  @EventPattern('factura.en_espera')
  handleFacturaEnEspera(@Payload() data: FacturaEnEsperaEvent): void {
    this.logger.warn(
      `[factura.en_espera] factura=${data.invoiceNumber} encolada=${data.queuedAt} — ` +
        `FEL no disponible. Se reintentará automáticamente en 5 min.`,
    );
    this.events.emitFacturaEnEspera(data);
  }

  @EventPattern('orden.entregada')
  handleOrdenEntregada(@Payload() data: OrdenEntregadaEvent): void {
    this.logger.log(
      `[orden.entregada] orden=${data.orderNumber} cliente=${data.clientId} ` +
        `total=${data.currency} ${data.totalAmount} entregada=${data.deliveredAt}`,
    );
    this.events.emitOrdenEntregada(data);
  }

  @EventPattern('factura.certificada')
  handleFacturaCertificada(@Payload() data: FacturaCertificadaEvent): void {
    this.logger.log(
      `[factura.certificada] factura=${data.invoiceNumber} cliente=${data.clientId} ` +
        `total=${data.currency} ${data.totalAmount} uuid=${data.felUuid} certificada=${data.certifiedAt}`,
    );
    this.events.emitFacturaCertificada(data);
  }

  @EventPattern('factura.rechazada')
  handleFacturaRechazada(@Payload() data: FacturaRechazadaEvent): void {
    this.logger.warn(
      `[factura.rechazada] factura=${data.invoiceNumber} ` +
        `motivo="${data.reason}" rechazada=${data.rejectedAt}`,
    );
    this.events.emitFacturaRechazada(data);
  }

  @EventPattern('pago.aprobado')
  handlePagoAprobado(@Payload() data: PagoAprobadoEvent): void {
    this.logger.log(
      `[pago.aprobado] pago=${data.paymentId} factura=${data.invoiceId} ` +
        `monto=${data.currency} ${data.amount} estado=${data.invoiceStatus} aprobado=${data.approvedAt}`,
    );
    this.events.emitPagoAprobado(data);
  }
}
