import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Invoice } from '../../../infrastructure/database/typeorm/entities/invoice.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';

interface DashboardSummaryFilters {
  period?: 'MONTHLY';
  year?: number;
  month?: number;
}

@Injectable()
export class CertifierService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboardSummary(filters: DashboardSummaryFilters = {}) {
    const invoiceRepo = this.dataSource.getRepository(Invoice);

    const pendingInvoices = await invoiceRepo.count({
      where: { status: InvoiceStatus.BORRADOR },
    });

    const now = new Date();
    const year = filters.year ?? now.getFullYear();
    const month = filters.month ?? now.getMonth() + 1;
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth =
      month === 12
        ? new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0))
        : new Date(Date.UTC(year, month, 1, 0, 0, 0));
    
    // Counting certified this month as an example for the summary
    const certifiedCount = await invoiceRepo
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: InvoiceStatus.CERTIFICADA })
      .andWhere('invoice.certifiedAt >= :start', { start: startOfMonth })
      .andWhere('invoice.certifiedAt < :end', { end: endOfMonth })
      .getCount();

    return { pendingInvoices, certifiedCount };
  }

  async getPendingInvoices() {
    return this.dataSource.getRepository(Invoice).find({
      where: { status: InvoiceStatus.BORRADOR },
      select: ['invoiceId', 'invoiceNumber', 'issueDate', 'clientName', 'clientNit', 'totalAmount', 'status'],
      order: { issueDate: 'ASC' },
    });
  }

  async validateNit(invoiceId: number, clientNit: string) {
    const invoice = await this.dataSource.getRepository(Invoice).findOne({ where: { invoiceId } });
    if (!invoice) throw new NotFoundException('Factura no encontrada');

    const normalizedInputNit = clientNit.replace(/\D/g, '');
    const normalizedInvoiceNit = invoice.clientNit.replace(/\D/g, '');
    const hasValidFormat = /^\d{13}$/.test(normalizedInputNit);
    const isValid = hasValidFormat && normalizedInputNit === normalizedInvoiceNit;

    return {
      invoiceId,
      clientNit,
      isValid,
    };
  }

  async certifyInvoice(invoiceId: number, felUuid: string, clientNit: string) {
    const invoice = await this.dataSource.getRepository(Invoice).findOne({ where: { invoiceId } });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    if (invoice.status !== InvoiceStatus.BORRADOR) {
      throw new BadRequestException('La factura no esta en estado BORRADOR');
    }

    const nitValidation = await this.validateNit(invoiceId, clientNit);
    if (!nitValidation.isValid) {
      throw new BadRequestException(
        'Debe validar correctamente el NIT del receptor antes de certificar la factura',
      );
    }

    invoice.status = InvoiceStatus.CERTIFICADA;
    invoice.felUuid = felUuid;
    invoice.certifiedAt = new Date();

    await this.dataSource.getRepository(Invoice).save(invoice);

    return {
      invoiceId: invoice.invoiceId,
      status: invoice.status,
      felUuid: invoice.felUuid,
      certifiedAt: invoice.certifiedAt,
    };
  }

  async rejectInvoice(invoiceId: number, reason: string) {
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      throw new BadRequestException('Debe ingresar un motivo de rechazo valido');
    }

    return this.dataSource.transaction(async (manager) => {
      const invoiceRepo = manager.getRepository(Invoice);
      const logRepo = manager.getRepository(OrderRouteLog);

      const invoice = await invoiceRepo.findOne({ where: { invoiceId } });
      if (!invoice) throw new NotFoundException('Factura no encontrada');
      if (invoice.status !== InvoiceStatus.BORRADOR) {
        throw new BadRequestException('La factura no esta en estado BORRADOR');
      }

      invoice.status = InvoiceStatus.RECHAZADA;
      await invoiceRepo.save(invoice);

      const auditLog = logRepo.create({
        orderId: invoice.orderId,
        eventType: RouteEventType.OTRO,
        description: `Factura FEL rechazada (${invoice.invoiceNumber}): ${normalizedReason}`,
        eventTime: new Date(),
      });
      await logRepo.save(auditLog);

      return {
        invoiceId: invoice.invoiceId,
        status: invoice.status,
      };
    });
  }
}
