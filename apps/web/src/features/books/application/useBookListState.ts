import { useCallback, useMemo, useState } from 'react';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import type { BookFilters, BookListParams, SortField, SortRule } from '../domain/book.types';
import { toggleSort } from '../domain/sort';

export const SEARCH_DEBOUNCE_MS = 400;
const DEFAULT_LIMIT = 10;

export const INITIAL_FILTERS: BookFilters = {
  search: '',
  genreId: '',
  publisherId: '',
  authorId: '',
  availability: '',
};

/** Owns list UI state; only the debounced search reaches the query params. */
export function useBookListState() {
  const [filters, setFilters] = useState<BookFilters>(INITIAL_FILTERS);
  const [sort, setSort] = useState<SortRule[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(DEFAULT_LIMIT);
  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);

  const updateFilter = useCallback(<K extends keyof BookFilters>(key: K, value: BookFilters[K]) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  }, []);

  const toggleSortField = useCallback((field: SortField) => {
    setSort((previous) => toggleSort(previous, field));
    setPage(1);
  }, []);

  const setLimit = useCallback((value: number) => {
    setLimitState(value);
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setSort([]);
    setPage(1);
  }, []);

  const params = useMemo<BookListParams>(
    () => ({ filters: { ...filters, search: debouncedSearch }, sort, page, limit }),
    [filters, debouncedSearch, sort, page, limit],
  );

  return {
    filters,
    sort,
    params,
    updateFilter,
    toggleSort: toggleSortField,
    setPage,
    setLimit,
    reset,
  };
}
