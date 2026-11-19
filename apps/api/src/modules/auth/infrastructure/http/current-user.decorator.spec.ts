import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { extractCurrentUser } from './current-user.decorator';

const contextWith = (user?: unknown) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as unknown as ExecutionContext;

describe('extractCurrentUser', () => {
  it('returns the user attached by the JWT strategy', () => {
    const user = { id: '1', email: 'a@b.cl', role: 'ADMIN' };

    expect(extractCurrentUser(undefined, contextWith(user))).toBe(user);
  });

  it('rejects requests without an authenticated user', () => {
    expect(() => extractCurrentUser(undefined, contextWith())).toThrow(UnauthorizedException);
  });
});
