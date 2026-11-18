import { Prisma } from '@prisma/client';
import type {
  BookFilters,
  BookSort,
  BookSortField,
  SortDirection,
} from '../../domain/book-criteria';

type OrderBy = Prisma.BookOrderByWithRelationInput;

const SORT_COLUMNS: Record<BookSortField, (direction: SortDirection) => OrderBy> = {
  title: (direction) => ({ title: direction }),
  price: (direction) => ({ price: direction }),
  isAvailable: (direction) => ({ isAvailable: direction }),
  createdAt: (direction) => ({ createdAt: direction }),
  author: (direction) => ({ author: { name: direction } }),
  publisher: (direction) => ({ publisher: { name: direction } }),
  genre: (direction) => ({ genre: { name: direction } }),
};

const DEFAULT_SORT: readonly BookSort[] = [{ field: 'createdAt', direction: 'desc' }];

const contains = (value: string) => ({ contains: value, mode: Prisma.QueryMode.insensitive });

/** `undefined` values are ignored by Prisma, so absent filters simply vanish. */
export function buildBookWhere(filters: BookFilters): Prisma.BookWhereInput {
  const search = filters.search?.trim();
  return {
    deletedAt: null,
    genreId: filters.genreId,
    publisherId: filters.publisherId,
    authorId: filters.authorId,
    isAvailable: filters.isAvailable,
    OR: search
      ? [
          { title: contains(search) },
          { author: { name: contains(search) } },
          { publisher: { name: contains(search) } },
        ]
      : undefined,
  };
}

/** Appends `id` as a tie-breaker so pagination is deterministic. */
export function buildBookOrderBy(sort: readonly BookSort[]): OrderBy[] {
  const effective = sort.length > 0 ? sort : DEFAULT_SORT;
  return [
    ...effective.map(({ field, direction }) => SORT_COLUMNS[field](direction)),
    { id: 'asc' },
  ];
}
