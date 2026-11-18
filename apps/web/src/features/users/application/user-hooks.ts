import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorText } from '../../../shared/api/api-error';
import { usePageState } from '../../../shared/lib/usePageState';
import type { UserInput, UserPageParams } from '../domain/user.types';
import { usersApi } from '../infrastructure/users.api';

/** Pages and details live under one root key, so a single invalidation refreshes them all. */
export const userKeys = {
  all: ['users'] as const,
  page: (params: UserPageParams) => [...userKeys.all, 'page', params] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
};

/** Keeps the previous page on screen while the next one loads (no table flicker). */
export const useUsersPage = (params: UserPageParams) =>
  useQuery({
    queryKey: userKeys.page(params),
    queryFn: () => usersApi.listPage(params),
    placeholderData: keepPreviousData,
  });

export const useUsersPageState = () => usePageState(useUsersPage);

export const useUser = (id: string) =>
  useQuery({ queryKey: userKeys.detail(id), queryFn: () => usersApi.get(id) });

function useUserMutation<TInput>(mutationFn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export const useCreateUser = () => useUserMutation((input: UserInput) => usersApi.create(input));

export const useUpdateUser = (id: string) =>
  useUserMutation((input: UserInput) => usersApi.update(id, input));

export const useDeactivateUser = () => useUserMutation((id: string) => usersApi.remove(id));

/** A 409 means something different per action; anything else uses the generic copy. */
export const userErrorText = (error: unknown, onConflict: string): string =>
  errorText(error, { CONFLICT: onConflict });
