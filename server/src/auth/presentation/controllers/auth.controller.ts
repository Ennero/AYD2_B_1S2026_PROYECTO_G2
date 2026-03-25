import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RequestPasswordRecoveryUseCase } from '../../application/use-cases/request-password-recovery.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { LoginDto } from '../dtos/login.dto';
import { RecoveryRequestDto } from '../dtos/recovery-request.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';

const SESSION_COOKIE = 'sessionToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días en ms
};

/**
 * AuthController — Endpoints públicos de autenticación.
 *
 * Todos los endpoints viven bajo /api/auth.
 * La sesión se mantiene en dos piezas:
 *   1. JWT (Authorization: Bearer) — corta duración (1d), para recursos de API.
 *   2. sessionToken (httpOnly cookie) — larga duración (30d), para renovar el JWT.
 */
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly requestPasswordRecoveryUseCase: RequestPasswordRecoveryUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  /** POST /api/auth/login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { data, sessionToken } = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
      userRemote: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie(SESSION_COOKIE, sessionToken, COOKIE_OPTIONS);
    return { message: 'Usuario logueado', data };
  }

  /** POST /api/auth/refresh — usa el httpOnly cookie para renovar el JWT */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request) {
    const sessionToken = (req.cookies as Record<string, string>)?.[SESSION_COOKIE];
    if (!sessionToken) {
      throw new UnauthorizedException('No se encontró token de sesión.');
    }
    const data = await this.refreshSessionUseCase.execute(sessionToken);
    return { message: 'Sesion renovada correctamente', data };
  }

  /** POST /api/auth/logout — requiere JWT válido + cookie de sesión */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionToken = (req.cookies as Record<string, string>)?.[SESSION_COOKIE];
    await this.logoutUseCase.execute({
      sessionToken,
      sessionUuid: user?.sessionUuid,
    });
    res.clearCookie(SESSION_COOKIE);
    return { message: 'Sesion cerrada correctamente', data: {} };
  }

  /** POST /api/auth/recovery — envía email con token de un solo uso */
  @Post('recovery')
  @HttpCode(HttpStatus.OK)
  async requestRecovery(@Body() dto: RecoveryRequestDto, @Req() req: Request) {
    const data = await this.requestPasswordRecoveryUseCase.execute({
      email: dto.email,
      ipAddress: req.ip,
    });
    return { message: 'Correo con token unico enviado', data };
  }

  /**
   * POST /api/auth/password
   * El token de recuperación llega en el body como `token`.
   */
  @Post('password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute({
      rawToken: dto.token,
      password: dto.password,
      confirmation: dto.confirmation,
    });
    return { message: 'Contrasena modificada correctamente', data: {} };
  }
}
