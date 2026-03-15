import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AUTH_USER_REPOSITORY_TOKEN,
  type IAuthUserRepository,
} from '../../domain/repositories/auth-user.repository.interface';
import {
  USER_SESSION_REPOSITORY_TOKEN,
  type IUserSessionRepository,
} from '../../domain/repositories/user-session.repository.interface';
import type { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';

export interface RefreshOutput {
  sessionUuid: string;
  token: string;
}

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly userRepo: IAuthUserRepository,
    @Inject(USER_SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepo: IUserSessionRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(sessionToken: string): Promise<RefreshOutput> {
    const session = await this.sessionRepo.findActiveByToken(sessionToken);
    if (!session) {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inactivo.');
    }

    await this.sessionRepo.incrementUsage(session.sessionId);

    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      sessionUuid: session.sessionUuid,
    };

    const token = this.jwtService.sign(payload);
    return { sessionUuid: session.sessionUuid, token };
  }
}
