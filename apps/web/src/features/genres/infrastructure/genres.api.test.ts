import { httpClient } from '../../../shared/api/http-client';
import { genresApi } from './genres.api';

const GENRE = { id: 'g1', name: 'Poesía', description: 'Obras en verso.' };
const INPUT = { name: 'Poesía', description: 'Obras en verso.' };
const ok = (data: unknown) => ({ data: { success: true, data } });

describe('genresApi', () => {
  it('calls /genres and unwraps the envelope', async () => {
    const meta = { total: 1, page: 2, limit: 5, totalPages: 1 };
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ data: { success: true, data: [GENRE], meta } });
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue(ok(GENRE));
    const patch = vi.spyOn(httpClient, 'patch').mockResolvedValue(ok(GENRE));

    expect(await genresApi.listPage({ page: 2, limit: 5 })).toEqual({
      items: [GENRE],
      meta,
    });
    expect(await genresApi.create(INPUT)).toEqual(GENRE);
    expect(await genresApi.update('g1', INPUT)).toEqual(GENRE);
    get.mockResolvedValue(ok(GENRE));
    expect(await genresApi.get('g1')).toEqual(GENRE);

    expect(get).toHaveBeenCalledWith('/genres', { params: { page: 2, limit: 5 } });
    expect(get).toHaveBeenCalledWith('/genres/g1');
    expect(post).toHaveBeenCalledWith('/genres', INPUT);
    expect(patch).toHaveBeenCalledWith('/genres/g1', INPUT);
  });
});
