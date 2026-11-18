import type { Prisma } from '@prisma/client';
import type { Genre, GenreDetails, GenreSummary } from '../../domain/genre';

export const SELECT = { id: true, name: true, description: true } as const;

export const SUMMARY_SELECT = {
  ...SELECT,
  _count: { select: { books: { where: { deletedAt: null } } } },
} as const;

/** The id tie-breaker keeps pages stable when two genres share a name. */
export const ORDER_BY: Prisma.GenreOrderByWithRelationInput[] = [{ name: 'asc' }, { id: 'asc' }];

export const toGenre = ({ id, name, description }: Genre): Genre => ({
  id,
  name,
  description,
});

export const toSummary = (row: Genre & { _count: { books: number } }): GenreSummary => ({
  ...toGenre(row),
  activeBooks: row._count.books,
});

export const toColumns = (name: string, { description }: GenreDetails) => ({ name, description });
