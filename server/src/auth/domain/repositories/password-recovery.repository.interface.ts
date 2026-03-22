import { PasswordRecoveryToken } from '../../../infrastructure/database/typeorm/entities/password-recovery-token.entity';

export interface CreateRecoveryData {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}

export interface IPasswordRecoveryRepository {
  create(data: CreateRecoveryData): Promise<PasswordRecoveryToken>;
  /** Busca un token no usado y no expirado por su hash SHA-256. */
  findValidByTokenHash(tokenHash: string): Promise<PasswordRecoveryToken | null>;
  markAsUsed(tokenId: number): Promise<void>;
}

export const PASSWORD_RECOVERY_REPOSITORY_TOKEN = Symbol('IPasswordRecoveryRepository');
