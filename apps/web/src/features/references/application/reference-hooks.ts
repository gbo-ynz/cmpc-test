import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toApiError } from '../../../shared/api/api-error';
import { bookKeys } from '../../books/application/book-keys';
import type { ReferenceKind } from '../domain/reference.types';
import { referencesApi } from '../infrastructure/references.api';

export const referenceKeys = {
  all: ['references'] as const,
  list: (kind: ReferenceKind) => [...referenceKeys.all, kind] as const,
};

export const useReferences = (kind: ReferenceKind) =>
  useQuery({ queryKey: referenceKeys.list(kind), queryFn: () => referencesApi.list(kind) });

/** Any change can rename what books display or what the filters offer: refresh all of it. */
function useReferenceMutation<V>(
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

export const useCreateReference = (kind: ReferenceKind) =>
  useReferenceMutation(kind, (name: string) => referencesApi.create(kind, name));

export const useRenameReference = (kind: ReferenceKind) =>
  useReferenceMutation(kind, ({ id, name }: { id: string; name: string }) =>
    referencesApi.rename(kind, id, name),
  );

export const useDeleteReference = (kind: ReferenceKind) =>
  useReferenceMutation(kind, (id: string) => referencesApi.remove(kind, id));

/** A 409 means something different per action; anything else uses the generic copy. */
export function referenceErrorText(error: unknown, onConflict: string): string {
  const apiError = toApiError(error);
  return apiError.code === 'CONFLICT' ? onConflict : apiError.message;
}
