import { unwrap, type Envelope } from '../../../shared/api/envelope';
import { httpClient } from '../../../shared/api/http-client';
import type { Reference, ReferencesGateway } from '../domain/reference.types';

/** HTTP adapter implementing the ReferencesGateway port (/api/authors, /publishers, /genres). */
export const referencesApi: ReferencesGateway = {
  async list(kind) {
    return unwrap(await httpClient.get<Envelope<Reference[]>>(`/${kind}`));
  },
  async remove(kind, id) {
    await httpClient.delete(`/${kind}/${id}`);
  },
  async exportCsv(kind) {
    const response = await httpClient.get<Blob>(`/${kind}/export`, { responseType: 'blob' });
    return response.data;
  },
};
