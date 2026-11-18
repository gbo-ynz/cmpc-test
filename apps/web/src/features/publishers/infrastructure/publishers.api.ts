import { unwrap, unwrapPage, type Envelope } from '../../../shared/api/envelope';
import { httpClient } from '../../../shared/api/http-client';
import type { Publisher, PublisherSummary, PublishersGateway } from '../domain/publisher.types';

/** HTTP adapter implementing the PublishersGateway port (/api/publishers). */
export const publishersApi: PublishersGateway = {
  async listPage(params) {
    return unwrapPage(
      await httpClient.get<Envelope<PublisherSummary[]>>('/publishers', { params }),
    );
  },
  async get(id) {
    return unwrap(await httpClient.get<Envelope<Publisher>>(`/publishers/${id}`));
  },
  async create(input) {
    return unwrap(await httpClient.post<Envelope<Publisher>>('/publishers', input));
  },
  async update(id, input) {
    return unwrap(await httpClient.patch<Envelope<Publisher>>(`/publishers/${id}`, input));
  },
};
