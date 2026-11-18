import type { Prisma } from '@prisma/client';
import type { ManagedUser, UserChanges } from '../../domain/managed-user';

/** Never selects the password hash: administration reads cannot leak it. */
export const SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

// The id breaks ties so pages stay stable when names repeat.
export const ORDER_BY: Prisma.UserOrderByWithRelationInput[] = [{ name: 'asc' }, { id: 'asc' }];

export const toManagedUser = (row: ManagedUser): ManagedUser => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  createdAt: row.createdAt,
});

export const toUpdateData = ({ passwordHash, ...fields }: UserChanges): Prisma.UserUpdateInput => ({
  ...fields,
  ...(passwordHash === undefined ? {} : { passwordHash }),
});
