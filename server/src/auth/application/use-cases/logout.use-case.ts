import { Inject, Injectable } from '@nestjs/common';
import {
  USER_SESSION_REPOSITORY_TOKEN,
  type IUserSessionRepository,
} from '../../domain/repositories/user-session.repository.interface';

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
  async execute(sessionToken: string): Promise<void> {
    const session = await this.sessionRepo.findActiveByToken(sessionToken);
    if (session) {
      await this.sessionRepo.softDelete(session.sessionId);
    }
  }
}
