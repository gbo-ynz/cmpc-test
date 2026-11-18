import { InvalidBookError } from './book.errors';
import { Price } from './price';

describe('Price', () => {
  it('keeps up to two decimals without floating point drift', () => {
    const price = Price.of(19.99);

    expect(price.amount).toBe(19.99);
    expect(price.toDecimalString()).toBe('19.99');
  });

  it('formats integers with two decimals', () => {
    expect(Price.of(16990).toDecimalString()).toBe('16990.00');
  });

  it('compares by value', () => {
    expect(Price.of(10).equals(Price.of(10.0))).toBe(true);
    expect(Price.of(10).equals(Price.of(10.01))).toBe(false);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 10_000_000_000])(
    'rejects out of range amount %p',
    (amount) => {
      expect(() => Price.of(amount)).toThrow(InvalidBookError);
    },
  );

  it('rejects more than two decimals', () => {
    expect(() => Price.of(1.999)).toThrow('at most 2 decimals');
  });
});
