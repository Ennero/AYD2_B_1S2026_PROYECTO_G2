import { Invoice } from '../../../infrastructure/database/typeorm/entities/invoice.entity';
import { Payment } from '../../../infrastructure/database/typeorm/entities/payment.entity';
import { VehicleType } from '../../../infrastructure/database/typeorm/entities/vehicle-type.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';

export interface DashboardSummaryData {
  period: string;
  year: number;
  month: number;
  draftInvoicesPendingReview: number;
  certifiedInvoicesPendingSend: number;
  pendingPayments: number;
  collectedAmount: number;
  baseCurrency?: 'USD';
}

/**
 * Read-only repository interface for GERENCIA finance queries.
 * All methods target the read replica — no writes allowed.
 */
export interface IFinanceReadRepository {
  getDashboardSummary(
    year: number,
    month: number,
  ): Promise<DashboardSummaryData>;
  findInvoices(status?: InvoiceStatus): Promise<Invoice[]>;
  findInvoiceById(id: number): Promise<Invoice | null>;
  findPayments(status?: PaymentStatus): Promise<Payment[]>;
  findRates(): Promise<VehicleType[]>;
}

export const FINANCE_READ_REPOSITORY_TOKEN = Symbol('IFinanceReadRepository');
