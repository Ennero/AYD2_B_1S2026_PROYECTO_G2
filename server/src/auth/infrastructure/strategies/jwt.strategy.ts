import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Temporalmente hardcodeado hasta que integremos ConfigModule/Variables de Entorno
      secretOrKey: process.env.JWT_SECRET || 'secretKeyTemporario', 
    });
  }

  async validate(payload: JwtPayload) {
    // Este método se ejecuta si el token es válido y no ha expirado.
    // Retorna lo que será inyectado en request.user
    return { 
      sub: payload.sub, 
      email: payload.email, 
      role: payload.role, 
      fullName: payload.fullName 
    };
  }
}
