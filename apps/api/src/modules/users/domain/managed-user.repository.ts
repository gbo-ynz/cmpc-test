import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { ManagedUser, NewUser, UserChanges } from './managed-user';

/** Port for the users administration. Deactivated users are invisible except for the email lookup. */
export abstract class ManagedUserRepository {
  /** Active users sorted by name. */
  abstract listPage(request: PageRequest): Promise<Paginated<ManagedUser>>;
  abstract findById(id: string): Promise<ManagedUser | null>;
  /** Case-insensitive; includes deactivated users, whose email stays taken. */
  abstract findByEmail(email: string): Promise<ManagedUser | null>;
  abstract create(user: NewUser): Promise<ManagedUser>;
  abstract update(id: string, changes: UserChanges): Promise<ManagedUser>;
  /** Logical deletion: the user can no longer sign in, the audit trail keeps pointing to it. */
  abstract deactivate(id: string): Promise<void>;
  abstract countActiveAdmins(): Promise<number>;
}
