import { unwrap, unwrapPage, type Envelope } from '../../../shared/api/envelope';
import { httpClient } from '../../../shared/api/http-client';
import type { ManagedUser, UsersGateway } from '../domain/user.types';

/** HTTP adapter implementing the UsersGateway port (/api/users, administrators only). */
export const usersApi: UsersGateway = {
  async listPage(params) {
    return unwrapPage(await httpClient.get<Envelope<ManagedUser[]>>('/users', { params }));
  },
  async get(id) {
    return unwrap(await httpClient.get<Envelope<ManagedUser>>(`/users/${id}`));
  },
  async create(input) {
    return unwrap(await httpClient.post<Envelope<ManagedUser>>('/users', input));
  },
  async update(id, input) {
    return unwrap(await httpClient.patch<Envelope<ManagedUser>>(`/users/${id}`, input));
  },
  async remove(id) {
    await httpClient.delete(`/users/${id}`);
  },
};
