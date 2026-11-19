import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import type { UserRole } from '../../../shared/domain/authenticated-user';
import { InvalidCredentialsError, type User, UserRepository } from '../domain/user';
import { PasswordHasher } from './ports/password-hasher.port';
import { TokenIssuer } from './ports/token-issuer.port';

export interface LoginCommand {
  readonly email: string;
  readonly password: string;
}

export interface LoginResult {
  readonly accessToken: string;
  readonly user: { id: string; email: string; name: string; role: UserRole };
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenIssuer,
    private readonly audit: AuditLogger,
  ) {}

  async execute({ email, password }: LoginCommand): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);
    const isValid = await this.hasher.verify(password, user?.passwordHash);
    if (!user || !isValid) {
      await this.recordFailure(normalizedEmail, user);
      throw new InvalidCredentialsError();
    }

    const { id, name, role } = user;
    const accessToken = await this.tokens.issue({ id, email: user.email, role });
    await this.audit.record({ action: 'LOGIN', entityType: 'User', entityId: id, actorId: id });
    return { accessToken, user: { id, email: user.email, name, role } };
  }

  /**
   * The caller proved nothing, so there is no actor: a failed attempt is filed against the
   * targeted user (when it exists) but never attributed to them. The password is never stored,
   * and the HTTP answer stays identical for both reasons so it cannot be used to probe emails.
   */
  private recordFailure(email: string, user: User | null): Promise<void> {
    return this.audit.record({
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: user?.id,
      metadata: { email, reason: user ? 'WRONG_PASSWORD' : 'UNKNOWN_EMAIL' },
    });
  }
}
