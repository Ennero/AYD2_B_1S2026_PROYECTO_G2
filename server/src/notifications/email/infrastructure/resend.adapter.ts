import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  IEmailService,
  SendEmailOptions,
  EmailSendResult,
} from '../domain/email.service.interface';

/**
 * Adaptador de infraestructura — Resend.
 *
 * Implementa IEmailService usando el SDK oficial de Resend.
 * Toda la complejidad de red queda aislada aquí; los servicios de
 * aplicación sólo dependen del puerto (IEmailService).
 *
 * Configuración requerida en .env:
 *   RESEND_API_KEY   — Clave de API obtenida en resend.com/api-keys
 *   SES_FROM_EMAIL   — Dirección remitente verificada en Resend (dominio verificado)
 *   SES_FROM_NAME    — Nombre visible del remitente
 */
@Injectable()
export class ResendAdapter implements IEmailService, OnModuleInit {
  private readonly logger = new Logger(ResendAdapter.name);
  private client: Resend;
  private fromAddress: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const isMock = this.config.get<string>('MOCK_SMTP') === 'true';
    const apiKey = this.config.get<string>('RESEND_API_KEY', isMock ? 'mock-key' : '');
    const fromEmail = this.config.get<string>('SES_FROM_EMAIL', isMock ? 'mock@logitrans.com' : '');
    const fromName = this.config.get<string>('SES_FROM_NAME', 'LogiTrans');

    if (!isMock && (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '')) {
      throw new Error('RESEND_API_KEY is required unless MOCK_SMTP is true');
    }
    if (!isMock && (!fromEmail || typeof fromEmail !== 'string' || fromEmail.trim() === '')) {
      throw new Error('SES_FROM_EMAIL is required unless MOCK_SMTP is true');
    }

    this.client = new Resend(apiKey);
    this.fromAddress = `${fromName} <${fromEmail}>`;

    this.logger.log(`Resend adapter initialised — from: ${this.fromAddress} (Mock: ${isMock})`);
  }

  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    const isMock = this.config.get<string>('MOCK_SMTP') === 'true';

    if (isMock) {
      this.logger.log(`[MOCK_SMTP] Email enviado simulado — to: ${toAddresses.join(', ')}, subject: "${options.subject}"`);
      return { success: true, messageId: 'mock-id-' + Date.now() };
    }

    const { data, error } = await this.client.emails.send({
      from: this.fromAddress,
      to: toAddresses,
      subject: options.subject,
      html: options.html,
      ...(options.text && { text: options.text }),
      ...(options.replyTo && { replyTo: options.replyTo }),
    });

    if (error) {
      // Resend devuelve un objeto con `name` y `message` (ver https://resend.com/docs/api-reference/errors)
      const name = (error as { name?: string }).name ?? 'ResendError';
      const message = error.message ?? 'Unknown Resend error';
      this.logger.error(
        `[Resend] ${name}: ${message} — from: ${this.fromAddress}, to: ${toAddresses.join(', ')}, subject: "${options.subject}"\n` +
          `  💡 Asegúrate de que SES_FROM_EMAIL pertenece a un dominio verificado en resend.com/domains\n` +
          `     o usa onboarding@resend.dev para pruebas (solo envía al email de tu cuenta Resend).`,
      );
      return { success: false, error: `${name}: ${message}` };
    }

    const messageId = data?.id ?? 'unknown';
    this.logger.log(
      `Email enviado — id: ${messageId}, to: ${toAddresses.join(', ')}, subject: "${options.subject}"`,
    );
    return { success: true, messageId };
  }
}
