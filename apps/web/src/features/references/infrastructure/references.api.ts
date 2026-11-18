import { unwrap, type Envelope } from '../../../shared/api/envelope';
import { httpClient } from '../../../shared/api/http-client';
import type { Reference, ReferencesGateway } from '../domain/reference.types';

/** HTTP adapter implementing the ReferencesGateway port (/api/authors, /publishers, /genres). */
export const referencesApi: ReferencesGateway = {
  async list(kind) {
    return unwrap(await httpClient.get<Envelope<Reference[]>>(`/${kind}`));
  },
  async create(kind, name) {
    return unwrap(await httpClient.post<Envelope<Reference>>(`/${kind}`, { name }));
  },
  async rename(kind, id, name) {
    return unwrap(await httpClient.patch<Envelope<Reference>>(`/${kind}/${id}`, { name }));
  },
  async remove(kind, id) {
    await httpClient.delete(`/${kind}/${id}`);
  },
};
