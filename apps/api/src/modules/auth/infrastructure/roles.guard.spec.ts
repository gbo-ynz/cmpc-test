import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser, UserRole } from '../../../shared/domain/authenticated-user';
import { RolesGuard } from './roles.guard';

function contextFor(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

const guardRequiring = (roles?: UserRole[]) =>
  new RolesGuard({ getAllAndOverride: () => roles } as unknown as Reflector);

const user = (role: UserRole): AuthenticatedUser => ({ id: '1', email: 'a@b.cl', role });

describe('RolesGuard', () => {
  it('lets every authenticated user through routes without @Roles', () => {
    expect(guardRequiring(undefined).canActivate(contextFor(user('USER')))).toBe(true);
  });

  it('lets a user with an allowed role through', () => {
    expect(guardRequiring(['ADMIN']).canActivate(contextFor(user('ADMIN')))).toBe(true);
  });

  it('rejects a user without an allowed role with 403', () => {
    expect(() => guardRequiring(['ADMIN']).canActivate(contextFor(user('USER')))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a request without an authenticated user', () => {
    expect(() => guardRequiring(['ADMIN']).canActivate(contextFor())).toThrow(ForbiddenException);
  });
});
