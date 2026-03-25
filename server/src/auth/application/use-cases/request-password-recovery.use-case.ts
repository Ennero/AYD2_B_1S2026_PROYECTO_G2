import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import {
  AUTH_USER_REPOSITORY_TOKEN,
  type IAuthUserRepository,
} from '../../domain/repositories/auth-user.repository.interface';
import {
  PASSWORD_RECOVERY_REPOSITORY_TOKEN,
  type IPasswordRecoveryRepository,
} from '../../domain/repositories/password-recovery.repository.interface';
import { EmailService } from '../../../notifications/email/application/email.service';

const EXPIRES_IN_MINUTES = 30;

export interface RequestPasswordRecoveryInput {
  email: string;
  ipAddress?: string;
}

export interface RequestPasswordRecoveryOutput {
  expiresInMinutes: number;
}

@Injectable()
export class RequestPasswordRecoveryUseCase {
  private readonly logger = new Logger(RequestPasswordRecoveryUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly userRepo: IAuthUserRepository,
    @Inject(PASSWORD_RECOVERY_REPOSITORY_TOKEN)
    private readonly recoveryRepo: IPasswordRecoveryRepository,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: RequestPasswordRecoveryInput): Promise<RequestPasswordRecoveryOutput> {
    // Siempre retorna éxito para evitar enumeración de emails
    const user = await this.userRepo.findByEmail(input.email);

    if (user && user.isActive) {
      const rawToken = randomBytes(32).toString('hex');
      // SHA-256 es determinístico: permite buscar por hash sin iteración O(n)
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + EXPIRES_IN_MINUTES * 60 * 1000);

      await this.recoveryRepo.create({ userId: user.userId, tokenHash, expiresAt });

      const portalUrl = this.config.get<string>('PORTAL_URL', 'http://localhost:3000');
      const recoveryUrl = `${portalUrl}/auth/reset-password?token=${rawToken}`;

      // Fire-and-forget: no bloqueamos la respuesta por fallos de email
      this.emailService
        .sendPasswordRecovery({
          to: user.email,
          clientName: user.fullName,
          recoveryUrl,
          expiresInMinutes: EXPIRES_IN_MINUTES,
          ipAddress: input.ipAddress,
        })
        .catch((err: Error) =>
          this.logger.error(`Error al enviar email de recuperación a ${user.email}: ${err.message}`),
        );
    }

    return { expiresInMinutes: EXPIRES_IN_MINUTES };
  }
}
