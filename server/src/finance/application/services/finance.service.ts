import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Invoice } from '../../../infrastructure/database/typeorm/entities/invoice.entity';
import { Payment } from '../../../infrastructure/database/typeorm/entities/payment.entity';
import { VehicleType } from '../../../infrastructure/database/typeorm/entities/vehicle-type.entity';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';

interface DashboardSummaryFilters {
  period?: 'MONTHLY';
  year?: number;
  month?: number;
}

interface SubmitForCertificationPayload {
  serviceDescription: string;
  dueDate: string;
  reviewConfirmed: boolean;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

@Injectable()
export class FinanceService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboardSummary(filters: DashboardSummaryFilters = {}) {
    const now = new Date();
    const year = filters.year ?? now.getFullYear();
    const month = filters.month ?? now.getMonth() + 1;
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth =
      month === 12
        ? new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0))
        : new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const invoiceRepo = this.dataSource.getRepository(Invoice);

    const draftInvoicesPendingReview = await invoiceRepo.count({
      where: { status: InvoiceStatus.BORRADOR, serviceDescription: '' },
    });

    const certifiedInvoicesPendingSend = await invoiceRepo.count({
      where: { status: InvoiceStatus.CERTIFICADA },
    });

    const paymentRepo = this.dataSource.getRepository(Payment);
    const pendingPayments = await paymentRepo.count({
      where: { status: PaymentStatus.PENDIENTE },
    });

    const collectedRow = await paymentRepo
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'collected_amount')
      .where('payment.status = :status', { status: PaymentStatus.APROBADO })
      .andWhere('payment.paymentDate >= :start', { start: startOfMonth })
      .andWhere('payment.paymentDate < :end', { end: endOfMonth })
      .getRawOne<{ collected_amount: string }>();

    return {
      period: filters.period ?? 'MONTHLY',
      year,
      month,
      draftInvoicesPendingReview,
      certifiedInvoicesPendingSend,
      pendingPayments,
      collectedAmount: toNumber(collectedRow?.collected_amount),
    };
  }

  async getInvoices(status?: InvoiceStatus) {
    const invoiceRepo = this.dataSource.getRepository(Invoice);
    const whereCondition: any = status ? { status } : {};

    if (status === InvoiceStatus.BORRADOR) {
      whereCondition.serviceDescription = '';
    }

    const invoices = await invoiceRepo.find({
      where: whereCondition,
      relations: { order: true },
      order: { issueDate: 'DESC' },
    });

    return invoices.map((invoice) => ({
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      orderNumber: invoice.order?.orderNumber ?? null,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      clientNit: invoice.clientNit,
      issueDate: invoice.issueDate,
      deliveredAt: invoice.order?.deliveredAt ?? null,
      status: invoice.status,
      totalAmount: toNumber(invoice.totalAmount),
      felUuid: invoice.felUuid,
      certifiedAt: invoice.certifiedAt,
      sentAt: invoice.sentAt,
    }));
  }

  async getInvoiceById(invoiceId: number) {
    const invoice = await this.dataSource.getRepository(Invoice).findOne({
      where: { invoiceId },
      relations: { order: true },
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    return {
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      orderNumber: invoice.order?.orderNumber ?? null,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      clientNit: invoice.clientNit,
      clientAddress: invoice.clientAddress,
      serviceDescription: invoice.serviceDescription,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      deliveredAt: invoice.order?.deliveredAt ?? null,
      status: invoice.status,
      subtotalAmount: toNumber(invoice.subtotalAmount),
      taxAmount: toNumber(invoice.taxAmount),
      totalAmount: toNumber(invoice.totalAmount),
      felUuid: invoice.felUuid,
      certifiedAt: invoice.certifiedAt,
      sentAt: invoice.sentAt,
      pdfPath: invoice.pdfPath,
    };
  }

  async submitForCertification(
    invoiceId: number,
    reviewedByUserId: number,
    payload: SubmitForCertificationPayload,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const invoiceRepo = manager.getRepository(Invoice);
      const logRepo = manager.getRepository(OrderRouteLog);

      const invoice = await invoiceRepo.findOne({ where: { invoiceId } });
      if (!invoice) {
        throw new NotFoundException('Factura no encontrada');
      }

      if (invoice.status !== InvoiceStatus.BORRADOR) {
        throw new BadRequestException('Solo se puede enviar a certificacion una factura en estado BORRADOR');
      }

      if (!payload.reviewConfirmed) {
        throw new BadRequestException('Debes confirmar la revision del borrador antes de enviarlo a certificacion');
      }

      const normalizedDescription = payload.serviceDescription.trim();
      if (!normalizedDescription) {
        throw new BadRequestException('La descripcion del servicio es obligatoria');
      }

      const dueDate = new Date(payload.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        throw new BadRequestException('La fecha de vencimiento es invalida');
      }

      const issueDate = new Date(invoice.issueDate);
      const issueDateUtc = Date.UTC(issueDate.getUTCFullYear(), issueDate.getUTCMonth(), issueDate.getUTCDate());
      const dueDateUtc = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
      if (dueDateUtc < issueDateUtc) {
        throw new BadRequestException('La fecha de vencimiento no puede ser anterior a la fecha de emision');
      }

      invoice.serviceDescription = normalizedDescription;
      invoice.dueDate = payload.dueDate;
      await invoiceRepo.save(invoice);

      const reviewTimestamp = new Date();

      const auditLog = logRepo.create({
        orderId: invoice.orderId,
        eventType: RouteEventType.OTRO,
        eventTime: reviewTimestamp,
        description: `Revision financiera confirmada para ${invoice.invoiceNumber}. Borrador listo para certificacion FEL.`,
      });
      await logRepo.save(auditLog);

      return {
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        serviceDescription: invoice.serviceDescription,
        dueDate: invoice.dueDate,
        reviewedAt: reviewTimestamp,
        reviewedByUserId,
        nextStep: `/api/certifier/invoices/${invoice.invoiceId}/certify`,
      };
    });
  }

  async sendInvoice(invoiceId: number, pdfPath?: string) {
    const invoiceRepo = this.dataSource.getRepository(Invoice);
    const invoice = await invoiceRepo.findOne({ where: { invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (invoice.status !== InvoiceStatus.CERTIFICADA) {
      throw new BadRequestException('Solo se puede enviar una factura en estado CERTIFICADA');
    }

    if (invoice.sentAt) {
      throw new BadRequestException('La factura ya fue marcada como enviada anteriormente');
    }

    invoice.status = InvoiceStatus.ENVIADA;
    invoice.sentAt = new Date();
    invoice.pdfPath =
      (pdfPath && pdfPath.trim()) ||
      invoice.pdfPath ||
      `/files/invoices/${invoice.invoiceNumber}.pdf`;

    await invoiceRepo.save(invoice);

    return {
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      sentAt: invoice.sentAt,
      pdfPath: invoice.pdfPath,
    };
  }

  async getPayments(status?: PaymentStatus) {
    const payments = await this.dataSource.getRepository(Payment).find({
      where: status ? { status } : {},
      relations: { invoice: true },
      order: { paymentDate: 'DESC' },
    });

    return payments.map((payment) => ({
      paymentId: payment.paymentId,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoice?.invoiceNumber ?? null,
      clientName: payment.invoice?.clientName ?? null,
      method: payment.method,
      status: payment.status,
      bankName: payment.bankName,
      bankReference: payment.bankReference,
      amount: toNumber(payment.amount),
      paymentDate: payment.paymentDate,
      reviewedByUserId: payment.reviewedByUserId,
      invoiceStatus: payment.invoice?.status ?? null,
    }));
  }

  async approvePayment(paymentId: number, reviewedByUserId: number) {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const invoiceRepo = manager.getRepository(Invoice);

      const payment = await paymentRepo.findOne({ where: { paymentId } });
      if (!payment) {
        throw new NotFoundException('Pago no encontrado');
      }

      if (payment.status !== PaymentStatus.PENDIENTE) {
        throw new BadRequestException('Solo se puede aprobar un pago en estado PENDIENTE');
      }

      const invoice = await invoiceRepo.findOne({ where: { invoiceId: payment.invoiceId } });
      if (!invoice) {
        throw new NotFoundException('Factura asociada al pago no encontrada');
      }

      if (invoice.status === InvoiceStatus.RECHAZADA) {
        throw new BadRequestException('No se puede aprobar un pago asociado a una factura RECHAZADA');
      }

      payment.status = PaymentStatus.APROBADO;
      payment.reviewedByUserId = reviewedByUserId;
      await paymentRepo.save(payment);

      invoice.status = InvoiceStatus.PAGADA;
      await invoiceRepo.save(invoice);

      return {
        paymentId: payment.paymentId,
        invoiceId: payment.invoiceId,
        status: payment.status,
        reviewedByUserId: payment.reviewedByUserId,
        approvedAt: new Date(),
        invoiceStatus: invoice.status,
      };
    });
  }

  async getRates() {
    const rates = await this.dataSource.getRepository(VehicleType).find({
      order: { vehicleTypeId: 'ASC' },
    });

    return rates.map((rate) => ({
      vehicleTypeId: rate.vehicleTypeId,
      typeCode: rate.typeCode,
      typeName: rate.typeName,
      minCapacityTon: toNumber(rate.minCapacityTon),
      maxCapacityTon: rate.maxCapacityTon === null ? null : toNumber(rate.maxCapacityTon),
      ratePerKm: toNumber(rate.ratePerKm),
    }));
  }

  async updateRate(vehicleTypeId: number, ratePerKm: number) {
    const ratesRepo = this.dataSource.getRepository(VehicleType);
    const rate = await ratesRepo.findOne({ where: { vehicleTypeId } });

    if (!rate) {
      throw new NotFoundException('Tipo de vehiculo no encontrado');
    }

    if (ratePerKm <= 0) {
      throw new BadRequestException('La tarifa debe ser mayor a 0');
    }

    rate.ratePerKm = ratePerKm;
    await ratesRepo.save(rate);

    return {
      vehicleTypeId: rate.vehicleTypeId,
      typeCode: rate.typeCode,
      typeName: rate.typeName,
      ratePerKm: toNumber(rate.ratePerKm),
    };
  }
}
