export type UserRole = 'ADMIN' | 'USER';

/** Identity of the actor executing a use case (resolved from the JWT). */
export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
}
