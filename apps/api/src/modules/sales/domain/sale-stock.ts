import type { SellableBook } from './sale';

/** Port over the books' stock, so the sales rules never touch the ORM. */
export abstract class SaleStock {
  /** The active books among `ids` (deleted ones are not returned). */
  abstract findSellable(ids: readonly string[]): Promise<SellableBook[]>;
  /**
   * Atomic `stock = stock - quantity where stock >= quantity` on an active book: two concurrent
   * sales can never leave negative stock. Resolves false when it could not be applied.
   */
  abstract decrement(bookId: string, quantity: number): Promise<boolean>;
}
