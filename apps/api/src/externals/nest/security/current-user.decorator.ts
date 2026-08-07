import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UnauthorizedError } from '@/entities/errors/domain-error';
import { AuthenticatedUser, AuthPrincipal } from './authenticated-user';

type RequestWithUser = Request & { user?: AuthPrincipal };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user || user.kind !== 'professional') {
      throw new UnauthorizedError('Profissional não autenticado');
    }
    return user;
  },
);

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPrincipal => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw new UnauthorizedError('Não autenticado');
    }
    return request.user;
  },
);
