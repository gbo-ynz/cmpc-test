import { httpClient } from '../../../shared/api/http-client';
import { referencesApi } from './references.api';

describe('referencesApi', () => {
  it('lists and deletes through /{kind}', async () => {
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ data: { success: true, data: [{ id: 'g1' }] } });
    const remove = vi.spyOn(httpClient, 'delete').mockResolvedValue({});

    expect(await referencesApi.list('genres')).toEqual([{ id: 'g1' }]);
    await referencesApi.remove('genres', 'g1');

    expect(get).toHaveBeenCalledWith('/genres');
    expect(remove).toHaveBeenCalledWith('/genres/g1');
  });

  it('downloads the export of a catalog as a blob', async () => {
    const blob = new Blob(['csv']);
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: blob });

    await expect(referencesApi.exportCsv('authors')).resolves.toBe(blob);

    expect(get).toHaveBeenCalledWith('/authors/export', { responseType: 'blob' });
  });
});
