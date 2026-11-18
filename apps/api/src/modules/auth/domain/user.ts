import type { UserRole } from '../../../shared/domain/authenticated-user';
import { UnauthorizedError } from '../../../shared/domain/domain.error';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly passwordHash: string;
}

/** Repository port: users are looked up by email (login) and by id (token validation). */
export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid email or password');
  }
}
