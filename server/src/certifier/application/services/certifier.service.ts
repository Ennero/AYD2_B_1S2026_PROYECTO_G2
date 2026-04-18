import { randomUUID } from 'node:crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { Invoice } from '../../../infrastructure/database/typeorm/entities/invoice.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';
import { EmailService } from '../../../notifications/email/application/email.service';
import { RabbitmqService } from '../../../infrastructure/messaging/rabbitmq.service';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { User } from '../../../infrastructure/database/typeorm/entities/user.entity';
import { Payment } from '../../../infrastructure/database/typeorm/entities/payment.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';

interface DashboardSummaryFilters {
  period?: 'MONTHLY';
  year?: number;
  month?: number;
}

@Injectable()
export class CertifierService implements OnModuleInit {
  private readonly logger = new Logger(CertifierService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly rabbitmq: RabbitmqService,
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
      select: [
        'invoiceId',
        'invoiceNumber',
        'issueDate',
        'clientName',
        'clientNit',
        'totalAmount',
        'currencyCode',
        'status',
      ],
      order: { issueDate: 'ASC' },
    });
  }

  async getQueuedInvoices() {
    return this.dataSource.getRepository(Invoice).find({
      where: { status: InvoiceStatus.EN_ESPERA },
      select: [
        'invoiceId',
        'invoiceNumber',
        'issueDate',
        'clientName',
        'clientNit',
        'totalAmount',
        'currencyCode',
        'status',
      ],
      order: { issueDate: 'ASC' },
    });
  }

  onModuleInit() {
    // Retry queued invoices every 5 minutes automatically
    setInterval(() => void this.retryQueuedInvoices(), 5 * 60 * 1000);
  }

  // Move EN_ESPERA invoices back to BORRADOR so the certifier can retry them
  async retryQueuedInvoices(): Promise<void> {
    const queuedInvoices = await this.dataSource.getRepository(Invoice).find({
      where: { status: InvoiceStatus.EN_ESPERA },
    });

    if (queuedInvoices.length === 0) return;

    this.logger.log(
      `[FEL Queue] Reintentando ${queuedInvoices.length} facturas en espera...`,
    );

    for (const invoice of queuedInvoices) {
      try {
        await this.dataSource
          .getRepository(Invoice)
          .update(
            { invoiceId: invoice.invoiceId },
            { status: InvoiceStatus.BORRADOR },
          );
        this.logger.log(
          `[FEL Queue] Factura ${invoice.invoiceNumber} devuelta a BORRADOR para reintentar certificación.`,
        );
      } catch (err) {
        this.logger.error(
          `[FEL Queue] Error al reintentar ${invoice.invoiceNumber}: ${(err as Error).message}`,
        );
      }
    }
  }

  async validateNit(invoiceId: number, clientNit: string) {
    const invoice = await this.dataSource
      .getRepository(Invoice)
      .findOne({ where: { invoiceId } });
    if (!invoice) throw new NotFoundException('Factura no encontrada');

    const normalizedInputNit = clientNit.replace(/\D/g, '');
    const normalizedInvoiceNit = invoice.clientNit.replace(/\D/g, '');
    const hasValidFormat = /^\d{8,13}$/.test(normalizedInputNit);
    const isValid =
      hasValidFormat && normalizedInputNit === normalizedInvoiceNit;

    return {
      invoiceId,
      clientNit,
      isValid,
    };
  }

  async certifyInvoice(invoiceId: number, clientNit: string) {
    const invoice = await this.dataSource.transaction(async (manager) => {
      const invoiceRepo = manager.getRepository(Invoice);
      const paymentRepo = manager.getRepository(Payment);

      const targetInvoice = await invoiceRepo.findOne({
        where: { invoiceId },
        relations: { order: true },
      });
      if (!targetInvoice) throw new NotFoundException('Factura no encontrada');
      if (targetInvoice.status !== InvoiceStatus.BORRADOR) {
        throw new BadRequestException('La factura no esta en estado BORRADOR');
      }

      const nitValidation = await this.validateNit(invoiceId, clientNit);
      if (!nitValidation.isValid) {
        throw new BadRequestException(
          'Debe validar correctamente el NIT del receptor antes de certificar la factura',
        );
      }

      // Simulate FEL service availability check.
      // In production, replace this block with a real HTTP call to the SAT/FEL provider.
      // If the provider is unreachable, the invoice is moved to EN_ESPERA and retried automatically.
      const felServiceAvailable = await this.checkFelServiceAvailability();
      if (!felServiceAvailable) {
        targetInvoice.status = InvoiceStatus.EN_ESPERA;
        await invoiceRepo.save(targetInvoice);
        this.logger.warn(
          `[FEL] Servicio no disponible. Factura ${targetInvoice.invoiceNumber} puesta EN_ESPERA. Se reintentará automáticamente cada 5 minutos.`,
        );
        this.rabbitmq.emit('factura.en_espera', {
          invoiceId: targetInvoice.invoiceId,
          invoiceNumber: targetInvoice.invoiceNumber,
          queuedAt: new Date().toISOString(),
        });
        return targetInvoice;
      }

      const generatedFelUuid = randomUUID();

      targetInvoice.status = InvoiceStatus.CERTIFICADA;
      targetInvoice.felUuid = generatedFelUuid;
      targetInvoice.certifiedAt = new Date();
      targetInvoice.sentAt = null;

      await invoiceRepo.save(targetInvoice);

      const existingActivePayment = await paymentRepo.exist({
        where: {
          invoiceId: targetInvoice.invoiceId,
          status: In([PaymentStatus.PENDIENTE, PaymentStatus.APROBADO]),
        },
      });

      if (!existingActivePayment) {
        const pendingPayment = paymentRepo.create({
          invoiceId: targetInvoice.invoiceId,
          method: PaymentMethod.TRANSFERENCIA,
          status: PaymentStatus.PENDIENTE,
          currencyCode: targetInvoice.currencyCode,
          amount: targetInvoice.totalAmount,
          paymentDate: new Date(),
          supportDocumentPath: '/files/system/pending-payment-placeholder.txt',
        });
        await paymentRepo.save(pendingPayment);
      }

      return targetInvoice;
    });

    if (invoice.status === InvoiceStatus.EN_ESPERA) {
      return {
        invoiceId: invoice.invoiceId,
        status: invoice.status,
        felUuid: null,
        certifiedAt: null,
      };
    }

    await this.notifyFinanceTeam(
      `FEL certificó ${invoice.invoiceNumber}`,
      `La factura ${invoice.invoiceNumber} fue certificada correctamente en FEL y quedó lista para conciliación de pago en Finanzas antes del envío al cliente.`,
      invoice,
    );

    this.rabbitmq.emit('factura.certificada', {
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      totalAmount: Number(invoice.totalAmount),
      currency: invoice.currencyCode,
      felUuid: invoice.felUuid,
      certifiedAt: invoice.certifiedAt?.toISOString(),
    });

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
      throw new BadRequestException(
        'Debe ingresar un motivo de rechazo valido',
      );
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

      await this.notifyFinanceTeam(
        `FEL rechazó ${invoice.invoiceNumber}`,
        `La factura ${invoice.invoiceNumber} fue rechazada en FEL. Motivo: ${normalizedReason}`,
        invoice,
      );

      this.rabbitmq.emit('factura.rechazada', {
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        reason: normalizedReason,
        rejectedAt: new Date().toISOString(),
      });

      return {
        invoiceId: invoice.invoiceId,
        status: invoice.status,
      };
    });
  }

  private async checkFelServiceAvailability(): Promise<boolean> {
    // Production: replace with real HTTP ping to SAT/FEL provider endpoint.
    // Returns false when the provider is unreachable, triggering EN_ESPERA queuing.
    // Environment variable FEL_SERVICE_URL controls the real endpoint.
    const felUrl = process.env.FEL_SERVICE_URL;
    if (!felUrl) return true; // no URL configured → assume available (dev mode)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${felUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  private async notifyFinanceTeam(
    subject: string,
    summary: string,
    invoice: Invoice,
  ): Promise<void> {
    const financeUsers = await this.dataSource.getRepository(User).find({
      where: {
        role: UserRole.AGENTE_FINANCIERO,
        isActive: true,
      },
      select: ['email'],
    });

    const recipients = Array.from(
      new Set(
        financeUsers
          .map((user) => user.email)
          .filter((email): email is string => Boolean(email && email.trim())),
      ),
    );

    if (recipients.length === 0) {
      this.logger.warn(
        `No se encontraron agentes financieros activos para notificar ${invoice.invoiceNumber}.`,
      );
      return;
    }

    const issueDateText = new Date(invoice.issueDate)
      .toISOString()
      .slice(0, 10);

    await Promise.all(
      recipients.map((to) =>
        this.emailService
          .sendFinanceInvoiceStatus({
            to,
            subject,
            summary,
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.clientName,
            issueDate: issueDateText,
            dueDate: invoice.dueDate,
            total: Number(invoice.totalAmount).toFixed(2),
            currency: invoice.currencyCode,
            felAuthorizationCode: invoice.felUuid ?? undefined,
          })
          .catch((err: Error) =>
            this.logger.error(
              `Error al notificar a Finanzas (${to}) sobre ${invoice.invoiceNumber}: ${err.message}`,
            ),
          ),
      ),
    );
  }
}
