import { unwrap, unwrapPage, type Envelope } from '../../../shared/api/envelope';
import { httpClient } from '../../../shared/api/http-client';
import type { Genre, GenreSummary, GenresGateway } from '../domain/genre.types';

/** HTTP adapter implementing the GenresGateway port (/api/genres). */
export const genresApi: GenresGateway = {
  async listPage(params) {
    return unwrapPage(await httpClient.get<Envelope<GenreSummary[]>>('/genres', { params }));
  },
  async get(id) {
    return unwrap(await httpClient.get<Envelope<Genre>>(`/genres/${id}`));
  },
  async create(input) {
    return unwrap(await httpClient.post<Envelope<Genre>>('/genres', input));
  },
  async update(id, input) {
    return unwrap(await httpClient.patch<Envelope<Genre>>(`/genres/${id}`, input));
  },
};
