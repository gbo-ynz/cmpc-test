import type { PageRequest } from '../../../shared/domain/pagination';

export const BOOK_SORT_FIELDS = [
  'title',
  'author',
  'publisher',
  'genre',
  'price',
  'isAvailable',
  'createdAt',
] as const;

export type BookSortField = (typeof BOOK_SORT_FIELDS)[number];
export type SortDirection = 'asc' | 'desc';

export interface BookSort {
  readonly field: BookSortField;
  readonly direction: SortDirection;
}

export interface BookFilters {
  readonly search?: string;
  readonly genreId?: string;
  readonly publisherId?: string;
  readonly authorId?: string;
  readonly isAvailable?: boolean;
}

/** Specification-like query object, independent from any ORM. */
export interface BookQuery {
  readonly filters: BookFilters;
  readonly sort: readonly BookSort[];
}

export interface BookCriteria extends BookQuery, PageRequest {}
