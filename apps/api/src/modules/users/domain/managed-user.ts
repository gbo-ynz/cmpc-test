import { ValidationError } from '../../../shared/domain/domain.error';
import type { UserRole } from '../../../shared/domain/authenticated-user';

export const USER_ROLES: readonly UserRole[] = ['ADMIN', 'USER'];
export const USER_NAME_MAX_LENGTH = 120;
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** A user as the administration screens see it: it never carries the password hash. */
export interface ManagedUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly createdAt: Date;
}

export interface NewUser {
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly passwordHash: string;
}

/** `passwordHash` is only present when the administrator typed a new password. */
export type UserChanges = Omit<NewUser, 'passwordHash'> & { readonly passwordHash?: string };

/** Emails are stored in lower case, so "Ana@cmpc.cl" and "ana@cmpc.cl" are the same account. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export function normalizeUserName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, ' ');
  if (!normalized) throw new ValidationError('The name is required');
  if (normalized.length > USER_NAME_MAX_LENGTH) {
    throw new ValidationError(`The name must have at most ${USER_NAME_MAX_LENGTH} characters`);
  }
  return normalized;
}
