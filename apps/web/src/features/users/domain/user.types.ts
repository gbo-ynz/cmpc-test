import type { Page } from '../../../shared/api/envelope';

export type UserRole = 'ADMIN' | 'USER';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  USER: 'Usuario',
};

/** What the administration screens receive: the password never travels back. */
export interface ManagedUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly createdAt: string;
}

/** The password is only present when the administrator typed one. */
export interface UserInput {
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly password?: string;
}

export interface UserPageParams {
  readonly page: number;
  readonly limit: number;
}

/** Port: the UI depends on this contract, not on axios. */
export interface UsersGateway {
  listPage(params: UserPageParams): Promise<Page<ManagedUser>>;
  get(id: string): Promise<ManagedUser>;
  create(input: UserInput): Promise<ManagedUser>;
  update(id: string, input: UserInput): Promise<ManagedUser>;
  /** Logical deactivation: the user can no longer sign in. */
  remove(id: string): Promise<void>;
}
