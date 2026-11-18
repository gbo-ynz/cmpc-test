import { httpClient } from '../../../shared/api/http-client';
import { authorsApi } from './authors.api';

const AUTHOR = { id: 'a1', name: 'Gabriela Mistral', birthDate: '1889-04-07', biography: null };
const INPUT = { name: 'Gabriela Mistral', birthDate: '1889-04-07', biography: null };
const ok = (data: unknown) => ({ data: { success: true, data } });

describe('authorsApi', () => {
  it('calls /authors and unwraps the envelope', async () => {
    const meta = { total: 1, page: 2, limit: 5, totalPages: 1 };
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ data: { success: true, data: [AUTHOR], meta } });
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue(ok(AUTHOR));
    const patch = vi.spyOn(httpClient, 'patch').mockResolvedValue(ok(AUTHOR));

    expect(await authorsApi.listPage({ page: 2, limit: 5 })).toEqual({ items: [AUTHOR], meta });
    expect(await authorsApi.create(INPUT)).toEqual(AUTHOR);
    expect(await authorsApi.update('a1', INPUT)).toEqual(AUTHOR);
    get.mockResolvedValue(ok(AUTHOR));
    expect(await authorsApi.get('a1')).toEqual(AUTHOR);

    expect(get).toHaveBeenCalledWith('/authors', { params: { page: 2, limit: 5 } });
    expect(get).toHaveBeenCalledWith('/authors/a1');
    expect(post).toHaveBeenCalledWith('/authors', INPUT);
    expect(patch).toHaveBeenCalledWith('/authors/a1', INPUT);
  });
});
