import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EMAIL_SERVICE_TOKEN,
  type EmailSendResult,
  type IEmailService,
} from '../domain/email.service.interface';
import { welcomeTemplate, WelcomeTemplateData } from './templates/welcome.template';
import { passwordRecoveryTemplate, PasswordRecoveryTemplateData } from './templates/password-recovery.template';
import { contractProposalTemplate, ContractProposalTemplateData } from './templates/contract-proposal.template';
import { invoiceTemplate, InvoiceTemplateData } from './templates/invoice.template';

interface FinanceInvoiceStatusMail {
  to: string;
  subject: string;
  summary: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  total: string;
  currency: string;
  felAuthorizationCode?: string;
}

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

  constructor(
    @Inject(EMAIL_SERVICE_TOKEN) private readonly transport: IEmailService,
  ) {}

  // ─── HU-02: Bienvenida con credenciales ──────────────────────────────────

  async sendWelcome(
    data: WelcomeTemplateData & { to: string },
  ): Promise<EmailSendResult> {
    const tpl = welcomeTemplate({
      clientName: data.clientName,
      email: data.email,
      temporaryPassword: data.temporaryPassword,
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
      expiresInMinutes: data.expiresInMinutes ?? 30,
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
      felAuthorizationCode: data.felAuthorizationCode,
    });

    return this.transport.send({
      to: data.to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  }

  // ─── Notificación interna para Finanzas ────────────────────────────────

  async sendFinanceInvoiceStatus(
    data: FinanceInvoiceStatusMail,
  ): Promise<EmailSendResult> {
    const text = [
      data.summary,
      `Factura: ${data.invoiceNumber}`,
      `Cliente: ${data.clientName}`,
      `Emision: ${data.issueDate}`,
      `Vencimiento: ${data.dueDate}`,
      `Total: ${data.currency} ${data.total}`,
      data.felAuthorizationCode ? `FEL UUID: ${data.felAuthorizationCode}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
        <h2 style="margin:0 0 8px 0">${data.subject}</h2>
        <p style="margin:0 0 12px 0">${data.summary}</p>
        <ul style="padding-left:18px;margin:0">
          <li><strong>Factura:</strong> ${data.invoiceNumber}</li>
          <li><strong>Cliente:</strong> ${data.clientName}</li>
          <li><strong>Emisión:</strong> ${data.issueDate}</li>
          <li><strong>Vencimiento:</strong> ${data.dueDate}</li>
          <li><strong>Total:</strong> ${data.currency} ${data.total}</li>
          ${data.felAuthorizationCode ? `<li><strong>FEL UUID:</strong> ${data.felAuthorizationCode}</li>` : ''}
        </ul>
      </div>
    `;

    return this.transport.send({
      to: data.to,
      subject: data.subject,
      html,
      text,
    });
  }
}
