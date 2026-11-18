import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { AuthenticatedUser } from '../../domain/authenticated-user';

export function extractCurrentUser(_data: unknown, context: ExecutionContext): AuthenticatedUser {
  const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
  if (!request.user) throw new UnauthorizedException();
  return request.user;
}

export const CurrentUser = createParamDecorator(extractCurrentUser);
