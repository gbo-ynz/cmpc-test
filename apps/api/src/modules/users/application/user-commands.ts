import type { AuditAction, AuditEntry } from '../../../shared/application/audit-logger.port';
import type { ManagedUser } from '../domain/managed-user';
import type { ManagedUserRepository } from '../domain/managed-user.repository';
import {
  EmailTakenError,
  LastAdministratorError,
  SelfProtectionError,
  UserNotFoundError,
} from '../domain/user-admin.errors';

export async function requireUser(users: ManagedUserRepository, id: string): Promise<ManagedUser> {
  const found = await users.findById(id);
  if (!found) throw new UserNotFoundError(id);
  return found;
}

/** The email may stay the same when editing the account that owns it. */
export async function ensureEmailAvailable(
  users: ManagedUserRepository,
  email: string,
  ownerId?: string,
): Promise<void> {
  const existing = await users.findByEmail(email);
  if (existing && existing.id !== ownerId) throw new EmailTakenError(email);
}

/** Guards deleting an administrator or removing their profile (RF-10 CA-6). */
export async function ensureAdministratorStays(
  users: ManagedUserRepository,
  target: ManagedUser,
  actorId: string,
): Promise<void> {
  if (target.id === actorId) throw new SelfProtectionError();
  if (target.role === 'ADMIN' && (await users.countActiveAdmins()) <= 1) {
    throw new LastAdministratorError();
  }
}

/** Never records the password, only whether it changed. */
export function userAudit(
  action: AuditAction,
  user: ManagedUser,
  actorId: string,
  metadata: Record<string, unknown> = {},
): AuditEntry {
  const { email, name, role } = user;
  return {
    action,
    entityType: 'User',
    entityId: user.id,
    actorId,
    metadata: { email, name, role, ...metadata },
  };
}
