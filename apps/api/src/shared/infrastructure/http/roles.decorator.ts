import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../domain/authenticated-user';

export const ROLES_KEY = 'roles';

/** Restricts a route (or a whole controller) to the given roles; checked by the global RolesGuard. */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
