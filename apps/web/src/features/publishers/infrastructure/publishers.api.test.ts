import { httpClient } from '../../../shared/api/http-client';
import { publishersApi } from './publishers.api';

const PUBLISHER = { id: 'p1', name: 'Sudamericana', country: 'Argentina' };
const INPUT = { name: 'Sudamericana', country: 'Argentina' };
const ok = (data: unknown) => ({ data: { success: true, data } });

describe('publishersApi', () => {
  it('calls /publishers and unwraps the envelope', async () => {
    const meta = { total: 1, page: 2, limit: 5, totalPages: 1 };
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ data: { success: true, data: [PUBLISHER], meta } });
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue(ok(PUBLISHER));
    const patch = vi.spyOn(httpClient, 'patch').mockResolvedValue(ok(PUBLISHER));

    expect(await publishersApi.listPage({ page: 2, limit: 5 })).toEqual({
      items: [PUBLISHER],
      meta,
    });
    expect(await publishersApi.create(INPUT)).toEqual(PUBLISHER);
    expect(await publishersApi.update('p1', INPUT)).toEqual(PUBLISHER);
    get.mockResolvedValue(ok(PUBLISHER));
    expect(await publishersApi.get('p1')).toEqual(PUBLISHER);

    expect(get).toHaveBeenCalledWith('/publishers', { params: { page: 2, limit: 5 } });
    expect(get).toHaveBeenCalledWith('/publishers/p1');
    expect(post).toHaveBeenCalledWith('/publishers', INPUT);
    expect(patch).toHaveBeenCalledWith('/publishers/p1', INPUT);
  });
});
