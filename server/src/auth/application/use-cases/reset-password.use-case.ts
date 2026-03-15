import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  AUTH_USER_REPOSITORY_TOKEN,
  type IAuthUserRepository,
} from '../../domain/repositories/auth-user.repository.interface';
import {
  PASSWORD_RECOVERY_REPOSITORY_TOKEN,
  type IPasswordRecoveryRepository,
} from '../../domain/repositories/password-recovery.repository.interface';

const BCRYPT_ROUNDS = 12;

export interface ResetPasswordInput {
  rawToken: string;
  password: string;
  confirmation: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly userRepo: IAuthUserRepository,
    @Inject(PASSWORD_RECOVERY_REPOSITORY_TOKEN)
    private readonly recoveryRepo: IPasswordRecoveryRepository,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    if (input.password !== input.confirmation) {
      throw new BadRequestException('La contraseña y la confirmación no coinciden.');
    }

    if (!input.rawToken) {
      throw new UnauthorizedException('Token de recuperación requerido.');
    }

    const tokenHash = createHash('sha256').update(input.rawToken).digest('hex');
    const record = await this.recoveryRepo.findValidByTokenHash(tokenHash);

    if (!record) {
      throw new UnauthorizedException('El token de recuperación es inválido o ha expirado.');
    }

    const user = await this.userRepo.findById(record.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const isSamePassword = await bcrypt.compare(input.password, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña no puede ser igual a la actual.');
    }

    const newHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    await this.userRepo.updatePassword(user.userId, newHash);
    await this.recoveryRepo.markAsUsed(record.tokenId);
  }
}
