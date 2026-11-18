import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { downloadBlob } from '../../../shared/lib/download';
import type { Book } from '../domain/book.types';
import { booksApi } from '../infrastructure/books.api';
import { useDeleteBook, useExportCsv, useSaveBook } from './book-mutations';
import { useBook, useBookList, useCatalog } from './book-queries';
import { INITIAL_FILTERS, SEARCH_DEBOUNCE_MS, useBookListState } from './useBookListState';

vi.mock('../infrastructure/books.api', () => ({
  booksApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    uploadImage: vi.fn(),
    exportCsv: vi.fn(),
    catalog: vi.fn(),
  },
}));
vi.mock('../../../shared/lib/download', () => ({
  downloadBlob: vi.fn(),
  datedFileName: () => 'books.csv',
}));

const api = vi.mocked(booksApi);
const BOOK = { id: 'b1', title: 'Rayuela' } as Book;
const INPUT = {
  title: 'Rayuela',
  authorId: 'a1',
  publisherId: 'p1',
  genreId: 'g1',
  price: 1,
  stock: 3,
};

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

describe('useBookListState', () => {
  it('debounces the search before it reaches the query params', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useBookListState());

    act(() => result.current.updateFilter('search', 'borges'));
    expect(result.current.filters.search).toBe('borges');
    expect(result.current.params.filters.search).toBe('');

    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(result.current.params.filters.search).toBe('borges');
    vi.useRealTimers();
  });

  it('goes back to page 1 whenever filters, sort or page size change', () => {
    const { result } = renderHook(() => useBookListState());

    act(() => result.current.setPage(3));
    act(() => result.current.updateFilter('genreId', 'g1'));
    expect(result.current.params.page).toBe(1);

    act(() => result.current.setPage(2));
    act(() => result.current.toggleSort('price'));
    expect(result.current.params).toMatchObject({
      page: 1,
      sort: [{ field: 'price', direction: 'asc' }],
    });

    act(() => result.current.setLimit(50));
    expect(result.current.params).toMatchObject({ page: 1, limit: 50 });
  });

  it('resets filters and sort', () => {
    const { result } = renderHook(() => useBookListState());
    act(() => result.current.updateFilter('availability', 'true'));
    act(() => result.current.toggleSort('title'));

    act(() => result.current.reset());

    expect(result.current.filters).toEqual(INITIAL_FILTERS);
    expect(result.current.sort).toEqual([]);
  });
});

describe('query hooks', () => {
  it('loads list, detail and catalog through the gateway', async () => {
    api.list.mockResolvedValue({
      items: [BOOK],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    api.get.mockResolvedValue(BOOK);
    api.catalog.mockResolvedValue({ authors: [], publishers: [], genres: [] });
    const { Wrapper } = createWrapper();
    const params = { filters: INITIAL_FILTERS, sort: [], page: 1, limit: 10 };

    const list = renderHook(() => useBookList(params), { wrapper: Wrapper });
    const detail = renderHook(() => useBook('b1'), { wrapper: Wrapper });
    const catalog = renderHook(() => useCatalog(), { wrapper: Wrapper });

    await waitFor(() => expect(list.result.current.data?.items).toEqual([BOOK]));
    await waitFor(() => expect(detail.result.current.data).toEqual(BOOK));
    await waitFor(() => expect(catalog.result.current.isSuccess).toBe(true));
  });

  it('keeps the previous page visible while the next one loads (no table flicker)', async () => {
    const meta = { total: 2, page: 1, limit: 1, totalPages: 2 };
    const nextBook = { id: 'b2', title: 'Ficciones' } as Book;
    let resolveNext: (page: { items: Book[]; meta: typeof meta }) => void = () => undefined;
    api.list
      .mockResolvedValueOnce({ items: [BOOK], meta })
      .mockReturnValueOnce(new Promise((resolve) => (resolveNext = resolve)));
    const { Wrapper } = createWrapper();
    const params = (page: number) => ({ filters: INITIAL_FILTERS, sort: [], page, limit: 1 });
    const list = renderHook(({ page }) => useBookList(params(page)), {
      wrapper: Wrapper,
      initialProps: { page: 1 },
    });
    await waitFor(() => expect(list.result.current.data?.items).toEqual([BOOK]));

    list.rerender({ page: 2 });

    await waitFor(() => expect(list.result.current.isFetching).toBe(true));
    expect(list.result.current.data?.items).toEqual([BOOK]);
    expect(list.result.current.isPlaceholderData).toBe(true);

    await act(async () => resolveNext({ items: [nextBook], meta: { ...meta, page: 2 } }));

    await waitFor(() => expect(list.result.current.data?.items).toEqual([nextBook]));
    expect(list.result.current.isPlaceholderData).toBe(false);
  });

  it('does not fetch a book without id', () => {
    const { Wrapper } = createWrapper();

    renderHook(() => useBook(''), { wrapper: Wrapper });

    expect(api.get).not.toHaveBeenCalled();
  });
});

describe('mutation hooks', () => {
  it('creates a book without image and refreshes lists', async () => {
    api.create.mockResolvedValue(BOOK);
    const { Wrapper, client } = createWrapper();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useSaveBook(), { wrapper: Wrapper });

    await act(() => result.current.mutateAsync({ input: INPUT, image: null }));

    expect(api.create).toHaveBeenCalledWith(INPUT);
    expect(api.uploadImage).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['books', 'list'] });
  });

  it('refreshes the catalog counters of authors, publishers and genres after saving', async () => {
    api.create.mockResolvedValue(BOOK);
    const { Wrapper, client } = createWrapper();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useSaveBook(), { wrapper: Wrapper });

    await act(() => result.current.mutateAsync({ input: INPUT, image: null }));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['references'] });
  });

  it('refreshes the catalog counters after deleting a book', async () => {
    api.remove.mockResolvedValue(undefined);
    const { Wrapper, client } = createWrapper();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteBook(), { wrapper: Wrapper });

    await act(() => result.current.mutateAsync('b1'));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['references'] });
  });

  it('updates a book and then uploads the new image', async () => {
    api.update.mockResolvedValue(BOOK);
    api.uploadImage.mockResolvedValue({ ...BOOK, imageUrl: '/api/uploads/x.png' });
    const image = new File(['x'], 'x.png', { type: 'image/png' });
    const { result } = renderHook(() => useSaveBook(), { wrapper: createWrapper().Wrapper });

    const saved = await act(() => result.current.mutateAsync({ id: 'b1', input: INPUT, image }));

    expect(api.update).toHaveBeenCalledWith('b1', INPUT);
    expect(api.uploadImage).toHaveBeenCalledWith('b1', image);
    expect(saved.imageUrl).toBe('/api/uploads/x.png');
  });

  it('deletes a book and exports the CSV', async () => {
    api.remove.mockResolvedValue(undefined);
    api.exportCsv.mockResolvedValue(new Blob(['csv']));
    const { Wrapper } = createWrapper();
    const remove = renderHook(() => useDeleteBook(), { wrapper: Wrapper });
    const exporter = renderHook(() => useExportCsv(), { wrapper: Wrapper });

    await act(() => remove.result.current.mutateAsync('b1'));
    await act(() => exporter.result.current.mutateAsync({ filters: INITIAL_FILTERS, sort: [] }));

    expect(api.remove).toHaveBeenCalledWith('b1');
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'books.csv');
  });
});
