import type { Prisma } from '@prisma/client';
import type { Publisher, PublisherDetails, PublisherSummary } from '../../domain/publisher';

export const SELECT = { id: true, name: true, country: true } as const;

export const SUMMARY_SELECT = {
  ...SELECT,
  _count: { select: { books: { where: { deletedAt: null } } } },
} as const;

/** The id tie-breaker keeps pages stable when two publishers share a name. */
export const ORDER_BY: Prisma.PublisherOrderByWithRelationInput[] = [
  { name: 'asc' },
  { id: 'asc' },
];

export const toPublisher = ({ id, name, country }: Publisher): Publisher => ({
  id,
  name,
  country,
});

export const toSummary = (row: Publisher & { _count: { books: number } }): PublisherSummary => ({
  ...toPublisher(row),
  activeBooks: row._count.books,
});

export const toColumns = (name: string, { country }: PublisherDetails) => ({ name, country });
