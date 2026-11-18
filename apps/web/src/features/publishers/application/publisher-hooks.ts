import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { referenceKeys, useReferenceMutation } from '../../references/application/reference-hooks';
import type { PublisherInput, PublisherPageParams } from '../domain/publisher.types';
import { publishersApi } from '../infrastructure/publishers.api';

/**
 * Keys live under the catalog list key: deleting from the shared button or saving here refreshes
 * the publishers screen, the book form and the filters alike.
 */
export const publisherKeys = {
  list: referenceKeys.list('publishers'),
  page: (params: PublisherPageParams) =>
    [...referenceKeys.list('publishers'), 'page', params] as const,
  detail: (id: string) => [...referenceKeys.list('publishers'), id] as const,
};

/** Keeps the previous page on screen while the next one loads (no table flicker). */
export const usePublishersPage = (params: PublisherPageParams) =>
  useQuery({
    queryKey: publisherKeys.page(params),
    queryFn: () => publishersApi.listPage(params),
    placeholderData: keepPreviousData,
  });

export const usePublisher = (id: string) =>
  useQuery({ queryKey: publisherKeys.detail(id), queryFn: () => publishersApi.get(id) });

export const useCreatePublisher = () =>
  useReferenceMutation('publishers', (input: PublisherInput) => publishersApi.create(input));

export const useUpdatePublisher = (id: string) =>
  useReferenceMutation('publishers', (input: PublisherInput) => publishersApi.update(id, input));
