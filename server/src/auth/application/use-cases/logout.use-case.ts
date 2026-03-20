import { Inject, Injectable } from '@nestjs/common';
import {
  USER_SESSION_REPOSITORY_TOKEN,
  type IUserSessionRepository,
} from '../../domain/repositories/user-session.repository.interface';
import type { UserSession } from '../../../infrastructure/database/typeorm/entities/user-session.entity';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(USER_SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepo: IUserSessionRepository,
  ) {}

  /**
   * Revoca la sesión por soft-delete.
   * Es idempotente: si la sesión ya expiró o no existe, no lanza error.
   */
  async execute(params: { sessionToken?: string; sessionUuid?: string }): Promise<void> {
    let session: UserSession | null = null;

    if (params.sessionToken) {
      session = await this.sessionRepo.findActiveByToken(params.sessionToken);
    }

    if (!session && params.sessionUuid) {
      session = await this.sessionRepo.findActiveBySessionUuid(params.sessionUuid);
    }

    if (session) {
      await this.sessionRepo.softDelete(session.sessionId);
    }
  }
}
