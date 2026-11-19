import { InvalidBookError } from './book.errors';

/** Ten integer digits, the integer part of the DECIMAL(12,2) column. */
export const MAX_PRICE = 9_999_999_999;

/**
 * Value object: a price in whole Chilean pesos (CLP has no decimals in practice). Integers keep
 * money exact; the column stays DECIMAL(12,2) and simply stores 16990 as 16990.00.
 */
export class Price {
  private constructor(private readonly pesos: number) {}

  static of(amount: number): Price {
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_PRICE) {
      throw new InvalidBookError(`price must be between 0 and ${MAX_PRICE}`);
    }
    if (!Number.isInteger(amount)) {
      throw new InvalidBookError('price must be a whole number of pesos (CLP has no decimals)');
    }
    return new Price(amount);
  }

  get amount(): number {
    return this.pesos;
  }

  toDecimalString(): string {
    return this.pesos.toFixed(2);
  }

  equals(other: Price): boolean {
    return this.pesos === other.pesos;
  }
}
