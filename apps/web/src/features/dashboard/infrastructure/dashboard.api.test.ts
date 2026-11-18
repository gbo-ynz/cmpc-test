import { httpClient } from '../../../shared/api/http-client';
import { dashboardApi } from './dashboard.api';

describe('dashboardApi', () => {
  it('calls /dashboard and unwraps the envelope', async () => {
    const data = {
      books: { active: 1, available: 1, unavailable: 0 },
      booksByGenre: [],
      sales: {},
    };
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: { success: true, data } });

    expect(await dashboardApi.get()).toEqual(data);
    expect(get).toHaveBeenCalledWith('/dashboard');
  });
});
