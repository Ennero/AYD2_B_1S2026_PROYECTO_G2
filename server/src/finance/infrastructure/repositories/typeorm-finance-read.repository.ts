import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { REPLICA_DATA_SOURCE } from '../../../infrastructure/database/replica-database.module';
import {
  DashboardSummaryData,
  IFinanceReadRepository,
} from '../../domain/repositories/finance-read.repository.interface';
import { Invoice } from '../../../infrastructure/database/typeorm/entities/invoice.entity';
import { Payment } from '../../../infrastructure/database/typeorm/entities/payment.entity';
import { VehicleType } from '../../../infrastructure/database/typeorm/entities/vehicle-type.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Read-only TypeORM repository for GERENCIA queries.
 * Uses the REPLICA_DATA_SOURCE — all queries are routed to the read replica.
 * No save / update / delete methods are exposed here.
 */
@Injectable()
export class TypeOrmFinanceReadRepository implements IFinanceReadRepository {
  constructor(
    @Inject(REPLICA_DATA_SOURCE)
    private readonly dataSource: DataSource,
  ) {}

  async getDashboardSummary(
    year: number,
    month: number,
  ): Promise<DashboardSummaryData> {
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth =
      month === 12
        ? new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0))
        : new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const invoiceRepo = this.dataSource.getRepository(Invoice);
    const paymentRepo = this.dataSource.getRepository(Payment);

    const [draftCount, certifiedCount, pendingCount, collectedRow] =
      await Promise.all([
        invoiceRepo.count({ where: { status: InvoiceStatus.BORRADOR } }),
        invoiceRepo.count({ where: { status: InvoiceStatus.PAGADA } }),
        paymentRepo.count({ where: { status: PaymentStatus.PENDIENTE } }),
        this.dataSource.query<{ collected_amount_usd: string }[]>(
          `
          SELECT
            COALESCE(
              ROUND(
                SUM(p.amount / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1))::numeric,
                2
              ),
              0
            ) AS collected_amount_usd
          FROM payments p
          JOIN invoices i ON i.invoice_id = p.invoice_id
          WHERE p.status = $1
            AND p.payment_date >= $2
            AND p.payment_date < $3
        `,
          [
            PaymentStatus.APROBADO,
            startOfMonth.toISOString(),
            endOfMonth.toISOString(),
          ],
        ),
      ]);

    const collected = Array.isArray(collectedRow)
      ? collectedRow[0]
      : collectedRow;

    return {
      period: 'MONTHLY',
      year,
      month,
      draftInvoicesPendingReview: draftCount,
      certifiedInvoicesPendingSend: certifiedCount,
      pendingPayments: pendingCount,
      collectedAmount: toNumber(collected?.collected_amount_usd),
      baseCurrency: 'USD',
    };
  }

  async findInvoices(status?: InvoiceStatus): Promise<Invoice[]> {
    return this.dataSource.getRepository(Invoice).find({
      where: status ? { status } : {},
      relations: { order: true },
      order: { issueDate: 'DESC' },
    });
  }

  async findInvoiceById(id: number): Promise<Invoice | null> {
    return this.dataSource.getRepository(Invoice).findOne({
      where: { invoiceId: id },
      relations: { order: true },
    });
  }

  async findPayments(status?: PaymentStatus): Promise<Payment[]> {
    return this.dataSource.getRepository(Payment).find({
      where: status ? { status } : {},
      relations: { invoice: true },
      order: { paymentDate: 'DESC' },
    });
  }

  async findRates(): Promise<VehicleType[]> {
    return this.dataSource.getRepository(VehicleType).find({
      order: { vehicleTypeId: 'ASC' },
    });
  }
}
