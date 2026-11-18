import { httpClient } from '../../../shared/api/http-client';
import { salesApi } from './sales.api';

const SALE = { id: 's1', status: 'PENDING', total: 3000, items: [] };
const ok = (data: unknown) => ({ data: { success: true, data } });

describe('salesApi', () => {
  it('calls /sales and unwraps the envelope', async () => {
    const meta = { total: 1, page: 2, limit: 5, totalPages: 1 };
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ data: { success: true, data: [SALE], meta } });
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue(ok(SALE));

    expect(await salesApi.listPage({ page: 2, limit: 5, status: 'PENDING' })).toEqual({
      items: [SALE],
      meta,
    });
    get.mockResolvedValue(ok(SALE));
    expect(await salesApi.get('s1')).toEqual(SALE);
    await salesApi.create([{ bookId: 'b1', quantity: 2 }]);
    await salesApi.complete('s1', 'CASH');
    await salesApi.cancel('s1');

    expect(get).toHaveBeenCalledWith('/sales', {
      params: { page: 2, limit: 5, status: 'PENDING' },
    });
    expect(get).toHaveBeenCalledWith('/sales/s1');
    expect(post).toHaveBeenCalledWith('/sales', { items: [{ bookId: 'b1', quantity: 2 }] });
    expect(post).toHaveBeenCalledWith('/sales/s1/complete', { paymentMethod: 'CASH' });
    expect(post).toHaveBeenCalledWith('/sales/s1/cancel');
  });
});
