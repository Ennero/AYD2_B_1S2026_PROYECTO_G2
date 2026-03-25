import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { Invoice } from '../../../infrastructure/database/typeorm/entities/invoice.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';
import { EmailService } from '../../../notifications/email/application/email.service';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { User } from '../../../infrastructure/database/typeorm/entities/user.entity';
import { Client } from '../../../infrastructure/database/typeorm/entities/client.entity';

interface DashboardSummaryFilters {
  period?: 'MONTHLY';
  year?: number;
  month?: number;
}

@Injectable()
export class CertifierService {
  private readonly logger = new Logger(CertifierService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
  ) {}

  async getDashboardSummary(filters: DashboardSummaryFilters = {}) {
    const invoiceRepo = this.dataSource.getRepository(Invoice);

    const pendingInvoices = await invoiceRepo.count({
      where: { status: InvoiceStatus.BORRADOR, serviceDescription: Not('') },
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
      .where('invoice.certifiedAt IS NOT NULL')
      .andWhere('invoice.certifiedAt >= :start', { start: startOfMonth })
      .andWhere('invoice.certifiedAt < :end', { end: endOfMonth })
      .getCount();

    return { pendingInvoices, certifiedCount };
  }

  async getPendingInvoices() {
    return this.dataSource.getRepository(Invoice).find({
      where: { status: InvoiceStatus.BORRADOR, serviceDescription: Not('') },
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

  async certifyInvoice(invoiceId: number, clientNit: string) {
    const invoice = await this.dataSource.getRepository(Invoice).findOne({
      where: { invoiceId },
      relations: { order: true },
    });
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

    const crypto = require('crypto');
    const generatedFelUuid = crypto.randomUUID();

    invoice.status = InvoiceStatus.ENVIADA;
    invoice.felUuid = generatedFelUuid;
    invoice.certifiedAt = new Date();
    invoice.sentAt = new Date();

    await this.dataSource.getRepository(Invoice).save(invoice);

    const clientUser = await this.dataSource.getRepository(User).findOne({
      where: {
        clientId: invoice.clientId,
        role: UserRole.CLIENTE,
        isActive: true,
      },
    });

    const client = await this.dataSource.getRepository(Client).findOne({
      where: { clientId: invoice.clientId },
    });

    const destinationEmail = clientUser?.email ?? client?.primaryContactEmail;

    if (destinationEmail) {
      const issueDateText = new Date(invoice.issueDate).toISOString().slice(0, 10);
      const dueDateText = invoice.dueDate;

      this.emailService
        .sendInvoice({
          to: destinationEmail,
          clientName: invoice.clientName,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: issueDateText,
          dueDate: dueDateText,
          orderCode: invoice.order?.orderNumber ?? `ORD-${invoice.orderId}`,
          subtotal: Number(invoice.subtotalAmount).toFixed(2),
          taxes: Number(invoice.taxAmount).toFixed(2),
          total: Number(invoice.totalAmount).toFixed(2),
          currency: 'GTQ',
          pdfUrl: invoice.pdfPath ?? undefined,
          felAuthorizationCode: invoice.felUuid ?? undefined,
        })
        .catch((err: Error) =>
          this.logger.error(
            `Error al enviar factura certificada ${invoice.invoiceNumber}: ${err.message}`,
          ),
        );
    } else {
      this.logger.warn(
        `No se encontró correo de destino para la factura ${invoice.invoiceNumber} del cliente ${invoice.clientId}.`,
      );
    }

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
