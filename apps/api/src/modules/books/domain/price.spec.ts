import { InvalidBookError } from './book.errors';
import { Price } from './price';

describe('Price (whole Chilean pesos)', () => {
  it('keeps whole pesos and writes them with the scale of the DECIMAL(12,2) column', () => {
    const price = Price.of(16990);

    expect(price.amount).toBe(16990);
    expect(price.toDecimalString()).toBe('16990.00');
  });

  it('compares by value', () => {
    expect(Price.of(10).equals(Price.of(10.0))).toBe(true);
    expect(Price.of(10).equals(Price.of(11))).toBe(false);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 10_000_000_000])(
    'rejects out of range amount %p',
    (amount) => {
      expect(() => Price.of(amount)).toThrow(InvalidBookError);
    },
  );

  it.each([19.99, 16990.5, 0.1])('rejects decimals: CLP prices are whole pesos (%p)', (amount) => {
    expect(() => Price.of(amount)).toThrow('whole number of pesos');
  });
});
