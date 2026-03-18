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
      where: { status: InvoiceStatus.BORRADOR },
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
      .select('COALESCE(SUM(payment.amount), 0)', 'collectedAmount')
      .where('payment.status = :status', { status: PaymentStatus.APROBADO })
      .andWhere('payment.paymentDate >= :start', { start: startOfMonth })
      .andWhere('payment.paymentDate < :end', { end: endOfMonth })
      .getRawOne<{ collectedAmount: string }>();

    return {
      period: filters.period ?? 'MONTHLY',
      year,
      month,
      draftInvoicesPendingReview,
      certifiedInvoicesPendingSend,
      pendingPayments,
      collectedAmount: toNumber(collectedRow?.collectedAmount),
    };
  }

  async getInvoices(status?: InvoiceStatus) {
    const qb = this.dataSource
      .getRepository(Invoice)
      .createQueryBuilder('invoice')
      .leftJoin('invoice.order', 'order')
      .select([
        'invoice.invoiceId AS invoiceId',
        'invoice.invoiceNumber AS invoiceNumber',
        'invoice.orderId AS orderId',
        'order.orderNumber AS orderNumber',
        'invoice.clientId AS clientId',
        'invoice.clientName AS clientName',
        'invoice.clientNit AS clientNit',
        'invoice.issueDate AS issueDate',
        'order.deliveredAt AS deliveredAt',
        'invoice.status AS status',
        'invoice.totalAmount AS totalAmount',
        'invoice.felUuid AS felUuid',
        'invoice.certifiedAt AS certifiedAt',
        'invoice.sentAt AS sentAt',
      ])
      .orderBy('invoice.issueDate', 'DESC');

    if (status) {
      qb.where('invoice.status = :status', { status });
    }

    const rows = await qb.getRawMany<{
      invoiceId: string;
      invoiceNumber: string;
      orderId: string;
      orderNumber: string | null;
      clientId: string;
      clientName: string;
      clientNit: string;
      issueDate: Date;
      deliveredAt: Date | null;
      status: InvoiceStatus;
      totalAmount: string;
      felUuid: string | null;
      certifiedAt: Date | null;
      sentAt: Date | null;
    }>();

    return rows.map((row) => ({
      invoiceId: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      clientId: row.clientId,
      clientName: row.clientName,
      clientNit: row.clientNit,
      issueDate: row.issueDate,
      deliveredAt: row.deliveredAt,
      status: row.status,
      totalAmount: toNumber(row.totalAmount),
      felUuid: row.felUuid,
      certifiedAt: row.certifiedAt,
      sentAt: row.sentAt,
    }));
  }

  async getInvoiceById(invoiceId: string) {
    const row = await this.dataSource
      .getRepository(Invoice)
      .createQueryBuilder('invoice')
      .leftJoin('invoice.order', 'order')
      .select([
        'invoice.invoiceId AS invoiceId',
        'invoice.invoiceNumber AS invoiceNumber',
        'invoice.orderId AS orderId',
        'order.orderNumber AS orderNumber',
        'invoice.clientId AS clientId',
        'invoice.clientName AS clientName',
        'invoice.clientNit AS clientNit',
        'invoice.clientAddress AS clientAddress',
        'invoice.serviceDescription AS serviceDescription',
        'invoice.issueDate AS issueDate',
        'invoice.dueDate AS dueDate',
        'order.deliveredAt AS deliveredAt',
        'invoice.status AS status',
        'invoice.subtotalAmount AS subtotalAmount',
        'invoice.taxAmount AS taxAmount',
        'invoice.totalAmount AS totalAmount',
        'invoice.felUuid AS felUuid',
        'invoice.certifiedAt AS certifiedAt',
        'invoice.sentAt AS sentAt',
        'invoice.pdfPath AS pdfPath',
      ])
      .where('invoice.invoiceId = :invoiceId', { invoiceId })
      .getRawOne<{
        invoiceId: string;
        invoiceNumber: string;
        orderId: string;
        orderNumber: string | null;
        clientId: string;
        clientName: string;
        clientNit: string;
        clientAddress: string;
        serviceDescription: string;
        issueDate: Date;
        dueDate: string;
        deliveredAt: Date | null;
        status: InvoiceStatus;
        subtotalAmount: string;
        taxAmount: string;
        totalAmount: string;
        felUuid: string | null;
        certifiedAt: Date | null;
        sentAt: Date | null;
        pdfPath: string | null;
      }>();

    if (!row) {
      throw new NotFoundException('Factura no encontrada');
    }

    return {
      invoiceId: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      clientId: row.clientId,
      clientName: row.clientName,
      clientNit: row.clientNit,
      clientAddress: row.clientAddress,
      serviceDescription: row.serviceDescription,
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      deliveredAt: row.deliveredAt,
      status: row.status,
      subtotalAmount: toNumber(row.subtotalAmount),
      taxAmount: toNumber(row.taxAmount),
      totalAmount: toNumber(row.totalAmount),
      felUuid: row.felUuid,
      certifiedAt: row.certifiedAt,
      sentAt: row.sentAt,
      pdfPath: row.pdfPath,
    };
  }

  async submitForCertification(invoiceId: string, reviewedByUserId: string) {
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

      const reviewTimestamp = new Date();

      const auditLog = logRepo.create({
        orderId: invoice.orderId,
        eventType: RouteEventType.OTRO,
        eventTime: reviewTimestamp,
        description: `Revision financiera completada para ${invoice.invoiceNumber}. Lista para certificacion FEL.`,
      });
      await logRepo.save(auditLog);

      return {
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        reviewedAt: reviewTimestamp,
        reviewedByUserId,
        nextStep: `/api/certifier/invoices/${invoice.invoiceId}/certify`,
      };
    });
  }

  async sendInvoice(invoiceId: string, pdfPath?: string) {
    const invoiceRepo = this.dataSource.getRepository(Invoice);
    const invoice = await invoiceRepo.findOne({ where: { invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (invoice.status !== InvoiceStatus.CERTIFICADA) {
      throw new BadRequestException('Solo se puede enviar una factura en estado CERTIFICADA');
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
    const qb = this.dataSource
      .getRepository(Payment)
      .createQueryBuilder('payment')
      .leftJoin('payment.invoice', 'invoice')
      .select([
        'payment.paymentId AS paymentId',
        'payment.invoiceId AS invoiceId',
        'payment.method AS method',
        'payment.status AS status',
        'payment.bankName AS bankName',
        'payment.bankReference AS bankReference',
        'payment.amount AS amount',
        'payment.paymentDate AS paymentDate',
        'payment.reviewedByUserId AS reviewedByUserId',
        'invoice.invoiceNumber AS invoiceNumber',
        'invoice.clientName AS clientName',
        'invoice.status AS invoiceStatus',
      ])
      .orderBy('payment.paymentDate', 'DESC');

    if (status) {
      qb.where('payment.status = :status', { status });
    }

    const rows = await qb.getRawMany<{
      paymentId: string;
      invoiceId: string;
      method: string;
      status: PaymentStatus;
      bankName: string | null;
      bankReference: string | null;
      amount: string;
      paymentDate: Date;
      reviewedByUserId: string | null;
      invoiceNumber: string | null;
      clientName: string | null;
      invoiceStatus: InvoiceStatus | null;
    }>();

    return rows.map((row) => ({
      paymentId: row.paymentId,
      invoiceId: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      clientName: row.clientName,
      method: row.method,
      status: row.status,
      bankName: row.bankName,
      bankReference: row.bankReference,
      amount: toNumber(row.amount),
      paymentDate: row.paymentDate,
      reviewedByUserId: row.reviewedByUserId,
      invoiceStatus: row.invoiceStatus,
    }));
  }

  async approvePayment(paymentId: string, reviewedByUserId: string) {
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

      const refreshedInvoice = await invoiceRepo.findOne({ where: { invoiceId: payment.invoiceId } });

      return {
        paymentId: payment.paymentId,
        invoiceId: payment.invoiceId,
        status: payment.status,
        reviewedByUserId: payment.reviewedByUserId,
        approvedAt: new Date(),
        invoiceStatus: refreshedInvoice?.status ?? invoice.status,
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
