import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookKeys } from '../../books/application/book-keys';
import type { PaymentMethod, Sale, SaleLineInput, SalePageParams } from '../domain/sale.types';
import { salesApi } from '../infrastructure/sales.api';

/** Pages and details live under one root key, so a single invalidation refreshes them all. */
export const saleKeys = {
  all: ['sales'] as const,
  page: (params: SalePageParams) => [...saleKeys.all, 'page', params] as const,
  detail: (id: string) => [...saleKeys.all, id] as const,
};

/** Keeps the previous page on screen while the next one loads (no table flicker). */
export const useSalesPage = (params: SalePageParams) =>
  useQuery({
    queryKey: saleKeys.page(params),
    queryFn: () => salesApi.listPage(params),
    placeholderData: keepPreviousData,
  });

export const useSale = (id: string) =>
  useQuery({ queryKey: saleKeys.detail(id), queryFn: () => salesApi.get(id) });

/** `alsoBooks`: completing discounts stock, so book lists and details must be refreshed too. */
function useSaleMutation<TInput, TData = unknown>(
  mutationFn: (input: TInput) => Promise<TData>,
  alsoBooks = false,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: saleKeys.all }),
        alsoBooks ? queryClient.invalidateQueries({ queryKey: bookKeys.all }) : undefined,
      ]),
  });
}

export const useCreateSale = () =>
  useSaleMutation<readonly SaleLineInput[], Sale>((items) => salesApi.create(items));

export const useCompleteSale = (id: string) =>
  useSaleMutation((method: PaymentMethod) => salesApi.complete(id, method), true);

export const useCancelSale = (id: string) => useSaleMutation(() => salesApi.cancel(id));
