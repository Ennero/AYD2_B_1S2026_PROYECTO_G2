import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import {
  AUTH_USER_REPOSITORY_TOKEN,
  type IAuthUserRepository,
} from '../../domain/repositories/auth-user.repository.interface';
import {
  USER_SESSION_REPOSITORY_TOKEN,
  type IUserSessionRepository,
} from '../../domain/repositories/user-session.repository.interface';
import type { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';

export interface LoginInput {
  email: string;
  password: string;
  userRemote?: string;
  userAgent?: string;
}

export interface LoginOutput {
  userId: number;
  sessionUuid: string;
  role: string;
  fullName: string;
  token: string;
}

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly userRepo: IAuthUserRepository,
    @Inject(USER_SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepo: IUserSessionRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: LoginInput): Promise<{ data: LoginOutput; sessionToken: string }> {
    const user = await this.userRepo.findByEmail(input.email);

    // Mensaje genérico para no revelar si el email existe
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const sessionUuid = randomUUID();
    const sessionToken = randomBytes(40).toString('hex');
    const expirationAt = new Date(Date.now() + SESSION_DURATION_MS);

    await this.sessionRepo.create({
      userId: user.userId,
      userRemote: input.userRemote ?? null,
      userAgent: input.userAgent ? input.userAgent.slice(0, 255) : null,
      sessionUuid,
      sessionToken,
      sessionSource: 'WEB',
      expirationAt,
    });

    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      sessionUuid,
    };

    const token = this.jwtService.sign(payload);

    return {
      data: { userId: user.userId, sessionUuid, role: user.role, fullName: user.fullName, token },
      sessionToken,
    };
  }
}
