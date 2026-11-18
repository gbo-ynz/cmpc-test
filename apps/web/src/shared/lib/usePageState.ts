import type { UseQueryResult } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Page } from '../api/envelope';

const DEFAULT_PAGE_SIZE = 10;

interface PageParams {
  readonly page: number;
  readonly limit: number;
}

/** Page and size live here; the server does the slicing. */
export function usePageState<T>(usePage: (params: PageParams) => UseQueryResult<Page<T>>) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const query = usePage({ page, limit });
  const lastPage = query.data ? Math.max(query.data.meta.totalPages, 1) : page;

  // Deleting the last record of the last page leaves it empty: step back to the new last page.
  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [page, lastPage]);

  const changeLimit = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  return { ...query, setPage, changeLimit };
}
