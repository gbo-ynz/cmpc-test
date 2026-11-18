import { unwrap, unwrapPage, type Envelope } from '../../../shared/api/envelope';
import { httpClient } from '../../../shared/api/http-client';
import type { Author, AuthorSummary, AuthorsGateway } from '../domain/author.types';

/** HTTP adapter implementing the AuthorsGateway port (/api/authors). */
export const authorsApi: AuthorsGateway = {
  async listPage(params) {
    return unwrapPage(await httpClient.get<Envelope<AuthorSummary[]>>('/authors', { params }));
  },
  async get(id) {
    return unwrap(await httpClient.get<Envelope<Author>>(`/authors/${id}`));
  },
  async create(input) {
    return unwrap(await httpClient.post<Envelope<Author>>('/authors', input));
  },
  async update(id, input) {
    return unwrap(await httpClient.patch<Envelope<Author>>(`/authors/${id}`, input));
  },
};
