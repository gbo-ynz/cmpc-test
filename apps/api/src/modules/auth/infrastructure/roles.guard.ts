import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser, UserRole } from '../../../shared/domain/authenticated-user';
import { ROLES_KEY } from '../../../shared/infrastructure/http/roles.decorator';

/**
 * Global guard registered after JwtAuthGuard, so request.user is already resolved (with the role
 * read from the database by JwtStrategy). Routes without @Roles stay open to any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (user && roles.includes(user.role)) return true;
    throw new ForbiddenException('You do not have permission to perform this action');
  }
}
