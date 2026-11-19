import type { Prisma } from '@prisma/client';
import type { AuditLogEntry } from '../../domain/audit-log';

export const ENTRY_SELECT = {
  id: true,
  action: true,
  entityType: true,
  entityId: true,
  metadata: true,
  createdAt: true,
  user: { select: { id: true, name: true } },
} as const satisfies Prisma.AuditLogSelect;

// The id breaks ties so two entries with the same timestamp keep a stable order.
export const ORDER_BY: Prisma.AuditLogOrderByWithRelationInput[] = [
  { createdAt: 'desc' },
  { id: 'desc' },
];

type Row = Prisma.AuditLogGetPayload<{ select: typeof ENTRY_SELECT }>;

export const toEntry = ({ user, ...row }: Row): AuditLogEntry => ({ ...row, actor: user });
