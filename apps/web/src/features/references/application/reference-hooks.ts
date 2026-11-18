import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorText } from '../../../shared/api/api-error';
import { datedFileName, downloadBlob } from '../../../shared/lib/download';
import { bookKeys } from '../../books/application/book-keys';
import { EXPORT_FILE_PREFIX, type ReferenceKind } from '../domain/reference.types';
import { referencesApi } from '../infrastructure/references.api';

export const referenceKeys = {
  all: ['references'] as const,
  list: (kind: ReferenceKind) => [...referenceKeys.all, kind] as const,
};

export const useReferences = (kind: ReferenceKind) =>
  useQuery({ queryKey: referenceKeys.list(kind), queryFn: () => referencesApi.list(kind) });

/** Any change can rename what books display or what the filters offer: refresh all of it. */
export function useReferenceMutation<V>(
  kind: ReferenceKind,
  mutationFn: (variables: V) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: referenceKeys.list(kind) }),
        queryClient.invalidateQueries({ queryKey: bookKeys.all }),
        queryClient.invalidateQueries({ queryKey: bookKeys.catalog }),
      ]),
  });
}

export const useDeleteReference = (kind: ReferenceKind) =>
  useReferenceMutation(kind, (id: string) => referencesApi.remove(kind, id));

/** Downloads the whole catalog, regardless of the page being shown. */
export const useExportReferences = (kind: ReferenceKind) =>
  useMutation({
    mutationFn: async () => {
      const blob = await referencesApi.exportCsv(kind);
      downloadBlob(blob, datedFileName(EXPORT_FILE_PREFIX[kind], 'csv'));
    },
  });

/** A 409 means something different per action; anything else uses the generic copy. */
export const referenceErrorText = (error: unknown, onConflict: string): string =>
  errorText(error, { CONFLICT: onConflict });
