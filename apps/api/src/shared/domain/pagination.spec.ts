import { isPaginated, mapPage, paginate, toSkip } from './pagination';

describe('pagination', () => {
  it('computes the offset from page and limit', () => {
    expect(toSkip({ page: 3, limit: 10 })).toBe(20);
  });

  it('builds the page metadata rounding total pages up', () => {
    const page = paginate(['a', 'b'], 21, { page: 1, limit: 10 });

    expect(page.meta).toEqual({ total: 21, page: 1, limit: 10, totalPages: 3 });
  });

  it('maps items while keeping metadata', () => {
    const page = mapPage(paginate([1, 2], 2, { page: 1, limit: 10 }), (n) => n * 2);

    expect(page.items).toEqual([2, 4]);
    expect(page.meta.total).toBe(2);
  });

  it.each([
    [paginate([], 0, { page: 1, limit: 10 }), true],
    [{ items: 'nope', meta: {} }, false],
    [null, false],
    ['text', false],
  ])('detects paginated payloads (%#)', (value, expected) => {
    expect(isPaginated(value)).toBe(expected);
  });
});
