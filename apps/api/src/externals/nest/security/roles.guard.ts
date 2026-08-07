import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ForbiddenError } from '@/entities/errors/domain-error';
import { UserRole } from '@/entities/user-role';
import { AuthPrincipal } from './authenticated-user';
import { ROLES_KEY } from './roles.decorator';

type RequestWithUser = Request & { user?: AuthPrincipal };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (
      !user ||
      user.kind !== 'professional' ||
      !required.includes(user.role)
    ) {
      throw new ForbiddenError('Papel insuficiente para este recurso');
    }
    return true;
  }
}
