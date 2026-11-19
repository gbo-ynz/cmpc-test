import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { Roles } from './roles.decorator';

/**
 * Restricts a route (or a whole controller) to administrators and documents the 403 in Swagger,
 * so the rule and its documentation cannot drift apart. Enforced by the global RolesGuard.
 */
export const AdminOnly = (): MethodDecorator & ClassDecorator =>
  applyDecorators(Roles('ADMIN'), ApiForbiddenResponse({ description: 'Administrators only' }));
