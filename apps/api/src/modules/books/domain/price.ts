import { InvalidBookError } from './book.errors';

// Matches the DECIMAL(12,2) column: 10 integer digits + 2 decimals.
const MAX_PRICE = 9_999_999_999.99;
const TWO_DECIMALS = /^\d+(\.\d{1,2})?$/;

/** Value object: money is stored in cents to avoid floating point drift. */
export class Price {
  private constructor(private readonly cents: number) {}

  static of(amount: number): Price {
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_PRICE) {
      throw new InvalidBookError(`price must be between 0 and ${MAX_PRICE}`);
    }
    if (!TWO_DECIMALS.test(String(amount))) {
      throw new InvalidBookError('price must have at most 2 decimals');
    }
    return new Price(Math.round(amount * 100));
  }

  get amount(): number {
    return this.cents / 100;
  }

  toDecimalString(): string {
    return this.amount.toFixed(2);
  }

  equals(other: Price): boolean {
    return this.cents === other.cents;
  }
}
