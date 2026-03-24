import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FINANCE_READ_REPOSITORY_TOKEN } from '../../domain/repositories/finance-read.repository.interface';
import type { IFinanceReadRepository } from '../../domain/repositories/finance-read.repository.interface';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Read-only service for GERENCIA finance operations.
 * All methods delegate to IFinanceReadRepository which targets the read replica.
 * No write methods are exposed — writes go through FinanceService (primary).
 */
@Injectable()
export class GerenciaFinanceReadService {
  constructor(
    @Inject(FINANCE_READ_REPOSITORY_TOKEN)
    private readonly readRepo: IFinanceReadRepository,
  ) {}

  async getDashboardSummary(year: number, month: number) {
    return this.readRepo.getDashboardSummary(year, month);
  }

  async getInvoices(status?: InvoiceStatus) {
    const invoices = await this.readRepo.findInvoices(status);
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
    const invoice = await this.readRepo.findInvoiceById(invoiceId);
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

  async getPayments(status?: PaymentStatus) {
    const payments = await this.readRepo.findPayments(status);
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

  async getRates() {
    const rates = await this.readRepo.findRates();
    return rates.map((rate) => ({
      vehicleTypeId: rate.vehicleTypeId,
      typeCode: rate.typeCode,
      typeName: rate.typeName,
      minCapacityTon: toNumber(rate.minCapacityTon),
      maxCapacityTon: rate.maxCapacityTon === null ? null : toNumber(rate.maxCapacityTon),
      ratePerKm: toNumber(rate.ratePerKm),
    }));
  }
}
