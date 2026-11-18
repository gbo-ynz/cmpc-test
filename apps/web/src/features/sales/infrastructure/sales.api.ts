import { unwrap, unwrapPage, type Envelope } from '../../../shared/api/envelope';
import { httpClient } from '../../../shared/api/http-client';
import type { Sale, SaleSummary, SalesGateway } from '../domain/sale.types';

/** HTTP adapter implementing the SalesGateway port (/api/sales). */
export const salesApi: SalesGateway = {
  async listPage(params) {
    return unwrapPage(await httpClient.get<Envelope<SaleSummary[]>>('/sales', { params }));
  },
  async get(id) {
    return unwrap(await httpClient.get<Envelope<Sale>>(`/sales/${id}`));
  },
  async create(items) {
    return unwrap(await httpClient.post<Envelope<Sale>>('/sales', { items }));
  },
  async complete(id, paymentMethod) {
    return unwrap(
      await httpClient.post<Envelope<Sale>>(`/sales/${id}/complete`, { paymentMethod }),
    );
  },
  async cancel(id) {
    return unwrap(await httpClient.post<Envelope<Sale>>(`/sales/${id}/cancel`));
  },
};
