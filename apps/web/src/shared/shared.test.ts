import { act, renderHook } from '@testing-library/react';
import { sessionStorage } from './auth/session-storage';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { datedFileName, downloadBlob } from './lib/download';
import { formatDate, formatPrice } from './lib/format';

const SESSION = {
  token: 'jwt',
  user: { id: '1', email: 'a@b.cl', name: 'A', role: 'EDITOR' as const },
};

describe('sessionStorage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('round-trips a session', () => {
    sessionStorage.write(SESSION);
    expect(sessionStorage.read()).toEqual(SESSION);

    sessionStorage.clear();
    expect(sessionStorage.read()).toBeNull();
  });

  it('ignores corrupted or foreign data', () => {
    localStorage.setItem('cmpc.session', '{not json');
    expect(sessionStorage.read()).toBeNull();

    localStorage.setItem('cmpc.session', JSON.stringify({ token: 1 }));
    expect(sessionStorage.read()).toBeNull();
  });

  it('never throws when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => sessionStorage.write(SESSION)).not.toThrow();
    expect(() => sessionStorage.clear()).not.toThrow();
  });
});

describe('useDebouncedValue', () => {
  it('only emits the value after the delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('ab');
    vi.useRealTimers();
  });
});

describe('download helpers', () => {
  it('clicks a temporary link and releases the object URL', () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    downloadBlob(new Blob(['a,b']), 'books.csv');

    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('builds dated file names', () => {
    expect(datedFileName('books', 'csv', new Date('2026-03-04T10:00:00Z'))).toBe(
      'books-2026-03-04.csv',
    );
  });
});

describe('formatters', () => {
  it('formats CLP prices and dates', () => {
    expect(formatPrice(16990)).toMatch(/16\.990/);
    expect(formatDate('2026-01-15T00:00:00.000Z')).toMatch(/2026/);
  });
});
