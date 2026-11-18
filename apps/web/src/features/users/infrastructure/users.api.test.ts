import { httpClient } from '../../../shared/api/http-client';
import { usersApi } from './users.api';

const USER = { id: 'u2', email: 'ana@cmpc.cl', name: 'Ana', role: 'USER', createdAt: '2026-01-01' };
const INPUT = { name: 'Ana', email: 'ana@cmpc.cl', role: 'USER' as const, password: 'secret123' };
const ok = (data: unknown) => ({ data: { success: true, data } });

describe('usersApi', () => {
  it('calls /users and unwraps the envelope', async () => {
    const meta = { total: 1, page: 2, limit: 5, totalPages: 1 };
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ data: { success: true, data: [USER], meta } });
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue(ok(USER));
    const patch = vi.spyOn(httpClient, 'patch').mockResolvedValue(ok(USER));
    const remove = vi.spyOn(httpClient, 'delete').mockResolvedValue({ status: 204 });

    expect(await usersApi.listPage({ page: 2, limit: 5 })).toEqual({ items: [USER], meta });
    expect(await usersApi.create(INPUT)).toEqual(USER);
    expect(await usersApi.update('u2', INPUT)).toEqual(USER);
    await usersApi.remove('u2');
    get.mockResolvedValue(ok(USER));
    expect(await usersApi.get('u2')).toEqual(USER);

    expect(get).toHaveBeenCalledWith('/users', { params: { page: 2, limit: 5 } });
    expect(get).toHaveBeenCalledWith('/users/u2');
    expect(post).toHaveBeenCalledWith('/users', INPUT);
    expect(patch).toHaveBeenCalledWith('/users/u2', INPUT);
    expect(remove).toHaveBeenCalledWith('/users/u2');
  });
});
