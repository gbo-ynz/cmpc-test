import type { BookListParams } from '../domain/book.types';

/** Query-key factory: one place to reason about cache invalidation. */
export const bookKeys = {
  all: ['books'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  list: (params: BookListParams) => [...bookKeys.lists(), params] as const,
  detail: (id: string) => [...bookKeys.all, 'detail', id] as const,
  catalog: ['catalog'] as const,
};
