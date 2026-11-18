import { useEffect, useState } from 'react';
import { useAuthorsPage } from './author-hooks';

const DEFAULT_PAGE_SIZE = 10;

/** Page and size live here; the server does the slicing. */
export function useAuthorsPageState() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const query = useAuthorsPage({ page, limit });
  const lastPage = query.data ? Math.max(query.data.meta.totalPages, 1) : page;

  // Deleting the last author of the last page leaves it empty: step back to the new last page.
  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [page, lastPage]);

  const changeLimit = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  return { ...query, setPage, changeLimit };
}
