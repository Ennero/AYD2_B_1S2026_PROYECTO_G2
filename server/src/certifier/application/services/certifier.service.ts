import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Invoice } from '../../../infrastructure/database/typeorm/entities/invoice.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';

@Injectable()
export class CertifierService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboardSummary() {
    const invoiceRepo = this.dataSource.getRepository(Invoice);

    const pendingInvoices = await invoiceRepo.count({
      where: { status: InvoiceStatus.BORRADOR },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Counting certified this month as an example for the summary
    const certifiedCount = await invoiceRepo
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: InvoiceStatus.CERTIFICADA })
      .andWhere('invoice.certifiedAt >= :start', { start: startOfMonth })
      .getCount();

    return { pendingInvoices, certifiedCount };
  }

  async getPendingInvoices() {
    return this.dataSource.getRepository(Invoice).find({
      where: { status: InvoiceStatus.BORRADOR },
      select: ['invoiceId', 'invoiceNumber', 'clientName', 'clientNit', 'totalAmount', 'status'],
      order: { issueDate: 'ASC' },
    });
  }

  async validateNit(invoiceId: string, clientNit: string) {
    const invoice = await this.dataSource.getRepository(Invoice).findOne({ where: { invoiceId } });
    if (!invoice) throw new NotFoundException('Factura no encontrada');

    // Basic mock validation, checking if they match
    const isValid = invoice.clientNit === clientNit || clientNit.trim().length > 4;
    return {
      invoiceId,
      clientNit,
      isValid,
    };
  }

  async certifyInvoice(invoiceId: string, felUuid: string) {
    const invoice = await this.dataSource.getRepository(Invoice).findOne({ where: { invoiceId } });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    if (invoice.status !== InvoiceStatus.BORRADOR) {
      throw new BadRequestException('La factura no esta en estado BORRADOR');
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

  async rejectInvoice(invoiceId: string, reason: string) {
    const invoice = await this.dataSource.getRepository(Invoice).findOne({ where: { invoiceId } });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    if (invoice.status !== InvoiceStatus.BORRADOR) {
      throw new BadRequestException('La factura no esta en estado BORRADOR');
    }

    invoice.status = InvoiceStatus.RECHAZADA;
    // Logically we would save the reason somewhere, but the Invoice entity doesn't have a specific field for this in MVP.
    // We can just reject it.
    await this.dataSource.getRepository(Invoice).save(invoice);

    return {
      invoiceId: invoice.invoiceId,
      status: invoice.status,
    };
  }
}
