import type { Prisma } from '@prisma/client';
import type { Author, AuthorDetails, AuthorSummary } from '../../domain/author';

export const SELECT = { id: true, name: true, birthDate: true, biography: true } as const;

interface AuthorRow {
  id: string;
  name: string;
  birthDate: Date | null;
  biography: string | null;
}

/** DATE columns arrive as UTC midnight: the first 10 ISO characters are the calendar day. */
export const toAuthor = ({ id, name, birthDate, biography }: AuthorRow): Author => ({
  id,
  name,
  birthDate: birthDate ? birthDate.toISOString().slice(0, 10) : null,
  biography,
});

export const SUMMARY_SELECT = {
  ...SELECT,
  _count: { select: { books: { where: { deletedAt: null } } } },
} as const;

/** The id tie-breaker keeps pages stable when two authors share a name. */
export const ORDER_BY: Prisma.AuthorOrderByWithRelationInput[] = [{ name: 'asc' }, { id: 'asc' }];

export const toSummary = (row: AuthorRow & { _count: { books: number } }): AuthorSummary => ({
  ...toAuthor(row),
  activeBooks: row._count.books,
});

export const toColumns = (name: string, { birthDate, biography }: AuthorDetails) => ({
  name,
  birthDate: birthDate ? new Date(`${birthDate}T00:00:00Z`) : null,
  biography,
});
