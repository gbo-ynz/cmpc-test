import type { NewSale, SellableBook } from './sale';
import { InvalidSaleError } from './sale.errors';

export interface RequestedLine {
  readonly bookId: string;
  readonly quantity: number;
}

/** Validates the lines against the books and snapshots the prices (RF-16 CA-1 and CA-3). */
export function buildSale(
  createdById: string,
  lines: readonly RequestedLine[],
  books: readonly SellableBook[],
): NewSale {
  if (lines.length === 0) throw new InvalidSaleError('A sale needs at least one line');
  const bookById = new Map(books.map((book) => [book.id, book]));
  const seen = new Set<string>();
  // Whole pesos (CLP): integer arithmetic, so the total is exact.
  let total = 0;
  const items = lines.map(({ bookId, quantity }) => {
    if (seen.has(bookId)) throw new InvalidSaleError('A book cannot appear in two lines');
    seen.add(bookId);
    const book = bookById.get(bookId);
    if (!book) throw new InvalidSaleError(`Book ${bookId} is not available`);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new InvalidSaleError('The quantity must be a whole number of at least 1');
    }
    if (quantity > book.stock) {
      throw new InvalidSaleError(`Only ${book.stock} unit(s) of "${book.title}" in stock`);
    }
    total += book.price * quantity;
    return { bookId, quantity, unitPrice: book.price };
  });
  return { createdById, items, total };
}
