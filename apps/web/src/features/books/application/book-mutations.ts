import { useMutation, useQueryClient } from '@tanstack/react-query';
import { datedFileName, downloadBlob } from '../../../shared/lib/download';
import type { BookFilters, BookInput, SortRule } from '../domain/book.types';
import { referenceKeys } from '../../references/application/reference-hooks';
import { booksApi } from '../infrastructure/books.api';
import { bookKeys } from './book-keys';

export interface SaveBookVariables {
  readonly id?: string;
  readonly input: BookInput;
  readonly image: File | null;
}

export function useSaveBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input, image }: SaveBookVariables) => {
      const book = id ? await booksApi.update(id, input) : await booksApi.create(input);
      return image ? booksApi.uploadImage(book.id, image) : book;
    },
    onSuccess: (book) => {
      queryClient.setQueryData(bookKeys.detail(book.id), book);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: bookKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: bookKeys.catalog }),
        queryClient.invalidateQueries({ queryKey: referenceKeys.all }),
      ]);
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => booksApi.remove(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: bookKeys.detail(id) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: bookKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: referenceKeys.all }),
      ]);
    },
  });
}

export function useExportCsv() {
  return useMutation({
    mutationFn: async ({ filters, sort }: { filters: BookFilters; sort: readonly SortRule[] }) => {
      const blob = await booksApi.exportCsv(filters, sort);
      downloadBlob(blob, datedFileName('libros', 'csv'));
    },
  });
}
