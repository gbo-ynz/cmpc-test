import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { referenceKeys, useReferenceMutation } from '../../references/application/reference-hooks';
import type { AuthorInput, AuthorPageParams } from '../domain/author.types';
import { authorsApi } from '../infrastructure/authors.api';

/**
 * Same cache key as the catalog list (same endpoint): deleting from the shared button or
 * saving here refreshes the authors screen, the book form and the filters alike.
 */
export const authorKeys = {
  list: referenceKeys.list('authors'),
  /** Under the list key: every create/update/delete invalidates all cached pages. */
  page: (params: AuthorPageParams) => [...referenceKeys.list('authors'), 'page', params] as const,
  detail: (id: string) => [...referenceKeys.list('authors'), id] as const,
};

/** Keeps the previous page on screen while the next one loads (no table flicker). */
export const useAuthorsPage = (params: AuthorPageParams) =>
  useQuery({
    queryKey: authorKeys.page(params),
    queryFn: () => authorsApi.listPage(params),
    placeholderData: keepPreviousData,
  });

export const useAuthor = (id: string) =>
  useQuery({ queryKey: authorKeys.detail(id), queryFn: () => authorsApi.get(id) });

export const useCreateAuthor = () =>
  useReferenceMutation('authors', (input: AuthorInput) => authorsApi.create(input));

export const useUpdateAuthor = (id: string) =>
  useReferenceMutation('authors', (input: AuthorInput) => authorsApi.update(id, input));
