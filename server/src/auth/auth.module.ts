import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    // La configuración ideal usaría ConfigModule y .env asíncronamente
    // Por el momento, registramos el JwtModule para que funcione el Auth.
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKeyTemporario',
      signOptions: { expiresIn: (process.env.JWT_EXPIRATION || '1d') as any },
    }),
  ],
  providers: [JwtStrategy], // Aquí también irían los UseCases en el futuro
  exports: [JwtModule], // Exportamos JwtModule por si otros módulos necesitan generar tokens (no validar)
})
export class AuthModule {}
