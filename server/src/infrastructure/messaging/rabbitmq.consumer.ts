import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

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

  @EventPattern('orden.entregada')
  handleOrdenEntregada(@Payload() data: OrdenEntregadaEvent): void {
    this.logger.log(
      `[orden.entregada] orden=${data.orderNumber} cliente=${data.clientId} ` +
      `total=${data.currency} ${data.totalAmount} entregada=${data.deliveredAt}`,
    );
  }

  @EventPattern('factura.certificada')
  handleFacturaCertificada(@Payload() data: FacturaCertificadaEvent): void {
    this.logger.log(
      `[factura.certificada] factura=${data.invoiceNumber} cliente=${data.clientId} ` +
      `total=${data.currency} ${data.totalAmount} uuid=${data.felUuid} certificada=${data.certifiedAt}`,
    );
  }

  @EventPattern('factura.rechazada')
  handleFacturaRechazada(@Payload() data: FacturaRechazadaEvent): void {
    this.logger.warn(
      `[factura.rechazada] factura=${data.invoiceNumber} ` +
      `motivo="${data.reason}" rechazada=${data.rejectedAt}`,
    );
  }

  @EventPattern('pago.aprobado')
  handlePagoAprobado(@Payload() data: PagoAprobadoEvent): void {
    this.logger.log(
      `[pago.aprobado] pago=${data.paymentId} factura=${data.invoiceId} ` +
      `monto=${data.currency} ${data.amount} estado=${data.invoiceStatus} aprobado=${data.approvedAt}`,
    );
  }
}
