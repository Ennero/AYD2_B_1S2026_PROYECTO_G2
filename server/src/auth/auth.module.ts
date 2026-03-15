import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { User } from '../infrastructure/database/typeorm/entities/user.entity';
import { UserSession } from '../infrastructure/database/typeorm/entities/user-session.entity';
import { PasswordRecoveryToken } from '../infrastructure/database/typeorm/entities/password-recovery-token.entity';

// Domain tokens
import { AUTH_USER_REPOSITORY_TOKEN } from './domain/repositories/auth-user.repository.interface';
import { USER_SESSION_REPOSITORY_TOKEN } from './domain/repositories/user-session.repository.interface';
import { PASSWORD_RECOVERY_REPOSITORY_TOKEN } from './domain/repositories/password-recovery.repository.interface';

// Infrastructure
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';
import { UserSessionRepository } from './infrastructure/repositories/user-session.repository';
import { PasswordRecoveryRepository } from './infrastructure/repositories/password-recovery.repository';

// Use cases
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RequestPasswordRecoveryUseCase } from './application/use-cases/request-password-recovery.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';

// Presentation
import { AuthController } from './presentation/controllers/auth.controller';

// External modules
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'secretKeyTemporario',
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRATION') || '1d') as any },
      }),
    }),
    TypeOrmModule.forFeature([User, UserSession, PasswordRecoveryToken]),
    NotificationsModule,
  ],
  providers: [
    // Estrategias Passport
    JwtStrategy,

    // Repositorios — binding interfaz → implementación
    { provide: AUTH_USER_REPOSITORY_TOKEN, useClass: AuthUserRepository },
    { provide: USER_SESSION_REPOSITORY_TOKEN, useClass: UserSessionRepository },
    { provide: PASSWORD_RECOVERY_REPOSITORY_TOKEN, useClass: PasswordRecoveryRepository },

    // Casos de uso
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    RequestPasswordRecoveryUseCase,
    ResetPasswordUseCase,
  ],
  controllers: [AuthController],
  exports: [JwtModule], // Otros módulos pueden generar/validar tokens
})
export class AuthModule {}
