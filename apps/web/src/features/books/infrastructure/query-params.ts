import type { BookFilters, BookListParams, SortRule } from '../domain/book.types';
import { serializeSort } from '../domain/sort';

type QueryValue = string | number;
type QueryParams = Record<string, QueryValue>;

const omitEmpty = (params: Record<string, QueryValue>): QueryParams =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ''));

/** Translates UI state into the API query contract (empty filters are not sent). */
export function toFilterParams(filters: BookFilters, sort: readonly SortRule[]): QueryParams {
  return omitEmpty({
    search: filters.search.trim(),
    genreId: filters.genreId,
    publisherId: filters.publisherId,
    authorId: filters.authorId,
    isAvailable: filters.availability,
    sort: serializeSort(sort),
  });
}

export function toListParams({ filters, sort, page, limit }: BookListParams): QueryParams {
  return { ...toFilterParams(filters, sort), page, limit };
}
