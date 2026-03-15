/**
 * Puerto (port) del servicio de email — capa de dominio.
 *
 * Define el contrato que cualquier adaptador de envío debe cumplir,
 * desacoplando la lógica de negocio de la implementación concreta (SES, SMTP, etc.)
 */

export interface SendEmailOptions {
  /** Destinatario(s) del correo */
  to: string | string[];
  /** Asunto del mensaje */
  subject: string;
  /** Cuerpo HTML del correo */
  html: string;
  /** Cuerpo de texto plano (fallback para clientes sin soporte HTML) */
  text?: string;
  /** Dirección "reply-to" opcional */
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const EMAIL_SERVICE_TOKEN = 'IEmailService';

export interface IEmailService {
  send(options: SendEmailOptions): Promise<EmailSendResult>;
}
