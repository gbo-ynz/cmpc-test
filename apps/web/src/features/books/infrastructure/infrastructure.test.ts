import { httpClient } from '../../../shared/api/http-client';
import type { BookFilters } from '../domain/book.types';
import { booksApi } from './books.api';
import { toFilterParams, toListParams } from './query-params';

const FILTERS: BookFilters = {
  search: '  borges ',
  genreId: 'g1',
  publisherId: '',
  authorId: '',
  availability: 'true',
};
const BOOK = { id: 'b1', title: 'Ficciones' };
const ok = (data: unknown, meta?: unknown) => ({ data: { success: true, data, meta } });

describe('query params', () => {
  it('drops empty filters and serializes sort', () => {
    expect(toFilterParams(FILTERS, [{ field: 'price', direction: 'desc' }])).toEqual({
      search: 'borges',
      genreId: 'g1',
      isAvailable: 'true',
      sort: 'price:desc',
    });
  });

  it('adds pagination for list requests', () => {
    expect(toListParams({ filters: FILTERS, sort: [], page: 2, limit: 20 })).toMatchObject({
      page: 2,
      limit: 20,
    });
  });
});

describe('booksApi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lists books with query params and page metadata', async () => {
    const meta = { total: 1, page: 1, limit: 10, totalPages: 1 };
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue(ok([BOOK], meta));

    await expect(
      booksApi.list({ filters: FILTERS, sort: [], page: 1, limit: 10 }),
    ).resolves.toEqual({ items: [BOOK], meta });
    expect(get).toHaveBeenCalledWith('/books', {
      params: expect.objectContaining({ genreId: 'g1', page: 1 }),
    });
  });

  it('reads, creates, updates and deletes', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValue(ok(BOOK));
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue(ok(BOOK));
    const patch = vi.spyOn(httpClient, 'patch').mockResolvedValue(ok(BOOK));
    const remove = vi.spyOn(httpClient, 'delete').mockResolvedValue({ data: null });
    const input = {
      title: 'T',
      author: 'A',
      publisher: 'P',
      genre: 'G',
      price: 1,
      isAvailable: true,
    };

    await expect(booksApi.get('b1')).resolves.toEqual(BOOK);
    await booksApi.create(input);
    await booksApi.update('b1', { price: 2 });
    await booksApi.remove('b1');

    expect(post).toHaveBeenCalledWith('/books', input);
    expect(patch).toHaveBeenCalledWith('/books/b1', { price: 2 });
    expect(remove).toHaveBeenCalledWith('/books/b1');
  });

  it('uploads the image as multipart form data', async () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue(ok(BOOK));

    await booksApi.uploadImage('b1', new File(['x'], 'c.png', { type: 'image/png' }));

    const form = post.mock.calls[0][1] as FormData;
    expect(post.mock.calls[0][0]).toBe('/books/b1/image');
    expect(form.get('file')).toBeInstanceOf(File);
  });

  it('downloads the CSV as a blob and loads the catalog', async () => {
    const blob = new Blob(['id']);
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValueOnce({ data: blob })
      .mockResolvedValueOnce(ok({ authors: [] }));

    await expect(booksApi.exportCsv(FILTERS, [])).resolves.toBe(blob);
    await expect(booksApi.catalog()).resolves.toEqual({ authors: [] });
    expect(get.mock.calls[0][1]).toMatchObject({ responseType: 'blob' });
  });
});
