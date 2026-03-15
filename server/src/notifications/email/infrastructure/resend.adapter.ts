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
    const apiKey = this.config.getOrThrow<string>('RESEND_API_KEY');
    const fromEmail = this.config.getOrThrow<string>('SES_FROM_EMAIL');
    const fromName = this.config.get<string>('SES_FROM_NAME', 'LogiTrans');

    this.client = new Resend(apiKey);
    this.fromAddress = `${fromName} <${fromEmail}>`;

    this.logger.log(`Resend adapter initialised — from: ${this.fromAddress}`);
  }

  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

    const { data, error } = await this.client.emails.send({
      from: this.fromAddress,
      to: toAddresses,
      subject: options.subject,
      html: options.html,
      ...(options.text && { text: options.text }),
      ...(options.replyTo && { replyTo: options.replyTo }),
    });

    if (error) {
      const message = error.message ?? 'Unknown Resend error';
      this.logger.error(
        `Error al enviar email — to: ${toAddresses.join(', ')}, subject: "${options.subject}" — ${message}`,
      );
      return { success: false, error: message };
    }

    const messageId = data?.id ?? 'unknown';
    this.logger.log(
      `Email enviado — id: ${messageId}, to: ${toAddresses.join(', ')}, subject: "${options.subject}"`,
    );
    return { success: true, messageId };
  }
}
