import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { BookListParams } from '../domain/book.types';
import { booksApi } from '../infrastructure/books.api';
import { bookKeys } from './book-keys';

const CATALOG_STALE_TIME_MS = 5 * 60_000;

/** Keeps the previous page on screen while the next one loads (no table flicker). */
export const useBookList = (params: BookListParams) =>
  useQuery({
    queryKey: bookKeys.list(params),
    queryFn: () => booksApi.list(params),
    placeholderData: keepPreviousData,
  });

export const useBook = (id: string) =>
  useQuery({ queryKey: bookKeys.detail(id), queryFn: () => booksApi.get(id), enabled: id !== '' });

export const useCatalog = () =>
  useQuery({
    queryKey: bookKeys.catalog,
    queryFn: () => booksApi.catalog(),
    staleTime: CATALOG_STALE_TIME_MS,
  });
