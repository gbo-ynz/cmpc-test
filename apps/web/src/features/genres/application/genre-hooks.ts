import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { referenceKeys, useReferenceMutation } from '../../references/application/reference-hooks';
import type { GenreInput, GenrePageParams } from '../domain/genre.types';
import { genresApi } from '../infrastructure/genres.api';

/**
 * Keys live under the catalog list key: deleting from the shared button or saving here refreshes
 * the genres screen, the book form and the filters alike.
 */
export const genreKeys = {
  list: referenceKeys.list('genres'),
  page: (params: GenrePageParams) => [...referenceKeys.list('genres'), 'page', params] as const,
  detail: (id: string) => [...referenceKeys.list('genres'), id] as const,
};

/** Keeps the previous page on screen while the next one loads (no table flicker). */
export const useGenresPage = (params: GenrePageParams) =>
  useQuery({
    queryKey: genreKeys.page(params),
    queryFn: () => genresApi.listPage(params),
    placeholderData: keepPreviousData,
  });

export const useGenre = (id: string) =>
  useQuery({ queryKey: genreKeys.detail(id), queryFn: () => genresApi.get(id) });

export const useCreateGenre = () =>
  useReferenceMutation('genres', (input: GenreInput) => genresApi.create(input));

export const useUpdateGenre = (id: string) =>
  useReferenceMutation('genres', (input: GenreInput) => genresApi.update(id, input));
