import type { Prisma } from '@prisma/client';
import type { ActivityEntry, GenreBookCount } from '../../domain/dashboard';

export const ACTIVITY_SELECT = {
  action: true,
  entityType: true,
  metadata: true,
  createdAt: true,
  user: { select: { name: true } },
} as const satisfies Prisma.AuditLogSelect;

// The id breaks ties so two entries with the same timestamp keep a stable order.
export const ACTIVITY_ORDER: Prisma.AuditLogOrderByWithRelationInput[] = [
  { createdAt: 'desc' },
  { id: 'desc' },
];

type ActivityRow = Prisma.AuditLogGetPayload<{ select: typeof ACTIVITY_SELECT }>;

const LABEL_KEYS = ['title', 'name', 'email'] as const;

/** The audit metadata is free-form JSON: only a plain string is shown as the entry's label. */
export function labelOf(metadata: Prisma.JsonValue): string | null {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) return null;
  for (const key of LABEL_KEYS) {
    const value = metadata[key];
    if (typeof value === 'string' && value !== '') return value;
  }
  return null;
}

export const toActivity = (row: ActivityRow): ActivityEntry => ({
  action: row.action,
  entityType: row.entityType,
  label: labelOf(row.metadata),
  actorName: row.user?.name ?? null,
  createdAt: row.createdAt,
});

/** Most books first; a genre without active books says nothing about the distribution. */
export const sortGenres = (rows: GenreBookCount[]): GenreBookCount[] =>
  rows
    .filter((row) => row.books > 0)
    .sort((a, b) => b.books - a.books || a.genre.localeCompare(b.genre));
