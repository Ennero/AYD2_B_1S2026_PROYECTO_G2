import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Aquí podemos añadir lógica extra si fuera necesario,
    // pero por defecto usar AuthGuard('jwt') verifica la firma y expiración
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Puede lanzar un error personalizado si el token es inválido o no existe
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Token inválido o expirado. Inicia sesión nuevamente.',
        )
      );
    }
    return user;
  }
}
