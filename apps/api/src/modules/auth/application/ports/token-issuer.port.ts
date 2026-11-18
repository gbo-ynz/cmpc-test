import type { AuthenticatedUser } from '../../../../shared/domain/authenticated-user';

export abstract class TokenIssuer {
  abstract issue(user: AuthenticatedUser): Promise<string>;
}
