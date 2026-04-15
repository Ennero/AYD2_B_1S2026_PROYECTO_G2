import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FINANCE_READ_REPOSITORY_TOKEN } from '../../domain/repositories/finance-read.repository.interface';
import type { IFinanceReadRepository } from '../../domain/repositories/finance-read.repository.interface';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveExchangeRateFromUsd(value: unknown): number {
  const parsed = toNumber(value);
  return parsed > 0 ? parsed : 1;
}

function toUsd(amount: number, exchangeRateFromUsd: number): number {
  const normalized = amount / exchangeRateFromUsd;
  return Number(normalized.toFixed(2));
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
    const summary = await this.readRepo.getDashboardSummary(year, month);
    return {
      ...summary,
      baseCurrency: 'USD' as const,
    };
  }

  async getInvoices(status?: InvoiceStatus) {
    const invoices = await this.readRepo.findInvoices(status);
    return invoices.map((invoice) => ({
      currencyCode: 'USD',
      originalCurrencyCode: invoice.currencyCode,
      exchangeRateFromUsd: resolveExchangeRateFromUsd(invoice.exchangeRateFromUsd),
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
      subtotalAmount: toUsd(
        toNumber(invoice.subtotalAmount),
        resolveExchangeRateFromUsd(invoice.exchangeRateFromUsd),
      ),
      taxAmount: toUsd(
        toNumber(invoice.taxAmount),
        resolveExchangeRateFromUsd(invoice.exchangeRateFromUsd),
      ),
      totalAmount: toUsd(
        toNumber(invoice.totalAmount),
        resolveExchangeRateFromUsd(invoice.exchangeRateFromUsd),
      ),
      subtotalAmountOriginal: toNumber(invoice.subtotalAmount),
      taxAmountOriginal: toNumber(invoice.taxAmount),
      totalAmountOriginal: toNumber(invoice.totalAmount),
      taxRate: toNumber(invoice.taxRate),
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
    const exchangeRateFromUsd = resolveExchangeRateFromUsd(invoice.exchangeRateFromUsd);
    const subtotalAmountOriginal = toNumber(invoice.subtotalAmount);
    const taxAmountOriginal = toNumber(invoice.taxAmount);
    const totalAmountOriginal = toNumber(invoice.totalAmount);

    return {
      currencyCode: 'USD',
      originalCurrencyCode: invoice.currencyCode,
      exchangeRateFromUsd,
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
      taxRate: toNumber(invoice.taxRate),
      subtotalAmount: toUsd(subtotalAmountOriginal, exchangeRateFromUsd),
      taxAmount: toUsd(taxAmountOriginal, exchangeRateFromUsd),
      totalAmount: toUsd(totalAmountOriginal, exchangeRateFromUsd),
      subtotalAmountOriginal,
      taxAmountOriginal,
      totalAmountOriginal,
      felUuid: invoice.felUuid,
      certifiedAt: invoice.certifiedAt,
      sentAt: invoice.sentAt,
      pdfPath: invoice.pdfPath,
    };
  }

  async getPayments(status?: PaymentStatus) {
    const payments = await this.readRepo.findPayments(status);
    return payments.map((payment) => ({
      currencyCode: 'USD',
      originalCurrencyCode: payment.currencyCode,
      exchangeRateFromUsd: resolveExchangeRateFromUsd(payment.invoice?.exchangeRateFromUsd),
      paymentId: payment.paymentId,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoice?.invoiceNumber ?? null,
      clientName: payment.invoice?.clientName ?? null,
      method: payment.method,
      status: payment.status,
      amount: toUsd(
        toNumber(payment.amount),
        resolveExchangeRateFromUsd(payment.invoice?.exchangeRateFromUsd),
      ),
      amountOriginal: toNumber(payment.amount),
      paymentDate: payment.paymentDate,
      reviewedByUserId: payment.reviewedByUserId,
      invoiceStatus: payment.invoice?.status ?? null,
    }));
  }

  async getRates() {
    const rates = await this.readRepo.findRates();
    return rates.map((rate) => ({
      baseCurrency: 'USD',
      vehicleTypeId: rate.vehicleTypeId,
      typeCode: rate.typeCode,
      typeName: rate.typeName,
      minCapacityTon: toNumber(rate.minCapacityTon),
      maxCapacityTon: rate.maxCapacityTon === null ? null : toNumber(rate.maxCapacityTon),
      ratePerKm: toNumber(rate.ratePerKm),
    }));
  }
}
