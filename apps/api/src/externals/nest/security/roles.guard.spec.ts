import { RolesGuard } from './roles.guard';
import { UserRole } from '@/entities/user-role';
import { ForbiddenError } from '@/entities/errors/domain-error';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

function mockContext(role?: UserRole): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () =>
        role ? { user: { userId: '1', email: 'x@y.z', role } } : {},
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('permite papel requerido', () => {
    const reflector = {
      getAllAndOverride: () => [UserRole.ADMIN],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(mockContext(UserRole.ADMIN))).toBe(true);
  });

  it('nega papel insuficiente', () => {
    const reflector = {
      getAllAndOverride: () => [UserRole.ADMIN],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(mockContext(UserRole.ENFERMEIRO))).toThrow(
      ForbiddenError,
    );
  });

  it('permite quando não há roles exigidos', () => {
    const reflector = {
      getAllAndOverride: () => undefined,
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(mockContext(UserRole.ENFERMEIRO))).toBe(true);
  });
});
