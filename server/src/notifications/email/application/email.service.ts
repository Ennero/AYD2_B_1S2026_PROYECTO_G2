import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMAIL_SERVICE_TOKEN,
  type EmailSendResult,
  type IEmailService,
} from '../domain/email.service.interface';
import { welcomeTemplate, WelcomeTemplateData } from './templates/welcome.template';
import { passwordRecoveryTemplate, PasswordRecoveryTemplateData } from './templates/password-recovery.template';
import { contractProposalTemplate, ContractProposalTemplateData } from './templates/contract-proposal.template';
import { invoiceTemplate, InvoiceTemplateData } from './templates/invoice.template';

/**
 * Capa de aplicación — Servicio de Email.
 *
 * Orquesta los templates con el adaptador de envío (IEmailService).
 * Los módulos de dominio (Contratos, Órdenes, Facturación) inyectan
 * este servicio para disparar notificaciones sin conocer el proveedor externo ni HTML.
 *
 * @example
 *   constructor(private readonly emailService: EmailService) {}
 *   await this.emailService.sendWelcome({ clientName: 'ACME', email: '...' });
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly portalUrl: string;

  constructor(
    @Inject(EMAIL_SERVICE_TOKEN) private readonly transport: IEmailService,
    private readonly config: ConfigService,
  ) {
    this.portalUrl = this.config.get<string>('PORTAL_URL', 'http://localhost:3000');
  }

  // ─── HU-02: Bienvenida con credenciales ──────────────────────────────────

  async sendWelcome(
    data: WelcomeTemplateData & { to: string },
  ): Promise<EmailSendResult> {
    const tpl = welcomeTemplate({
      clientName: data.clientName,
      email: data.email,
      temporaryPassword: data.temporaryPassword,
      portalUrl: data.portalUrl ?? this.portalUrl,
    });

    return this.transport.send({
      to: data.to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  }

  // ─── HU-03: Recuperación de contraseña ───────────────────────────────────

  async sendPasswordRecovery(
    data: PasswordRecoveryTemplateData & { to: string },
  ): Promise<EmailSendResult> {
    const tpl = passwordRecoveryTemplate({
      clientName: data.clientName,
      recoveryToken: data.recoveryToken,
      portalUrl: data.portalUrl ?? this.portalUrl,
      expiresInMinutes: data.expiresInMinutes ?? 30,
      ipAddress: data.ipAddress,
    });

    return this.transport.send({
      to: data.to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  }

  // ─── HU-04 / HU-05: Propuesta de contrato ────────────────────────────────

  async sendContractProposal(
    data: ContractProposalTemplateData & { to: string },
  ): Promise<EmailSendResult> {
    const tpl = contractProposalTemplate({
      clientName: data.clientName,
      contractCode: data.contractCode,
      routes: data.routes,
      validUntil: data.validUntil,
      totalAmount: data.totalAmount,
      currency: data.currency ?? 'GTQ',
      portalUrl: data.portalUrl ?? this.portalUrl,
      agentName: data.agentName,
    });

    return this.transport.send({
      to: data.to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  }

  // ─── HU-13: Factura FEL emitida ──────────────────────────────────────────

  async sendInvoice(
    data: InvoiceTemplateData & { to: string },
  ): Promise<EmailSendResult> {
    const tpl = invoiceTemplate({
      clientName: data.clientName,
      invoiceNumber: data.invoiceNumber,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      orderCode: data.orderCode,
      subtotal: data.subtotal,
      taxes: data.taxes,
      total: data.total,
      currency: data.currency ?? 'GTQ',
      pdfUrl: data.pdfUrl,
      portalUrl: data.portalUrl ?? this.portalUrl,
      felAuthorizationCode: data.felAuthorizationCode,
    });

    return this.transport.send({
      to: data.to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  }
}
