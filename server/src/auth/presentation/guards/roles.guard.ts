import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { USER_ROLE } from '../../domain/enums/user-role.enum';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<USER_ROLE[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Si la ruta no requiere ningún rol, permitimos el paso
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
        throw new ForbiddenException('No se encontraron credenciales válidas en la petición.');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
        throw new ForbiddenException(`Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}.`);
    }

    return true;
  }
}
