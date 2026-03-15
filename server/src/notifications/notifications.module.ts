import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EMAIL_SERVICE_TOKEN } from './email/domain/email.service.interface';
import { ResendAdapter } from './email/infrastructure/resend.adapter';
import { EmailService } from './email/application/email.service';

/**
 * NotificationsModule
 *
 * Agrupa toda la infraestructura de notificaciones salientes del sistema.
 * Actualmente expone:
 *   - EmailService  →  para notificar a clientes y agentes vía Amazon SES.
 *
 * Diseño:
 *   El token EMAIL_SERVICE_TOKEN desacopla EmailService del adaptador concreto.
 *   Para cambiar de SES a SMTP (o un stub en tests) sólo se reemplaza el
 *   provider correspondiente, sin tocar ningún módulo de negocio.
 *
 * Uso en otros módulos:
 *   @Module({ imports: [NotificationsModule] })
 *   class ContractModule {}
 *
 *   // En el servicio:
 *   constructor(private readonly emailService: EmailService) {}
 *   await this.emailService.sendContractProposal({ ... });
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_SERVICE_TOKEN,
      useClass: ResendAdapter,
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class NotificationsModule {}
