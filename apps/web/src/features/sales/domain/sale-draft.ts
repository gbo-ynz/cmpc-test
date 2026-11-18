import type { SaleLineInput } from './sale.types';

/** A line being built in the form: the stock caps how many units can be added. */
export interface DraftLine {
  readonly bookId: string;
  readonly title: string;
  readonly unitPrice: number;
  readonly stock: number;
  readonly quantity: number;
}

export type PickedBook = Pick<DraftLine, 'title' | 'stock'> & { id: string; price: number };

const clamp = (quantity: number, stock: number): number =>
  Number.isFinite(quantity) ? Math.min(Math.max(Math.trunc(quantity), 1), stock) : 1;

/** Picking a book already in the sale adds one more unit instead of repeating the line. */
export function addToDraft(lines: readonly DraftLine[], book: PickedBook): DraftLine[] {
  const existing = lines.find((line) => line.bookId === book.id);
  if (existing) return setQuantity(lines, book.id, existing.quantity + 1);
  const line = { bookId: book.id, title: book.title, unitPrice: book.price, stock: book.stock };
  return [...lines, { ...line, quantity: 1 }];
}

export const setQuantity = (
  lines: readonly DraftLine[],
  bookId: string,
  quantity: number,
): DraftLine[] =>
  lines.map((line) =>
    line.bookId === bookId ? { ...line, quantity: clamp(quantity, line.stock) } : line,
  );

export const removeLine = (lines: readonly DraftLine[], bookId: string): DraftLine[] =>
  lines.filter((line) => line.bookId !== bookId);

/** Cents avoid floating point drift, like the API does. */
export const draftTotal = (lines: readonly DraftLine[]): number =>
  lines.reduce((cents, line) => cents + Math.round(line.unitPrice * 100) * line.quantity, 0) / 100;

export const toSaleInput = (lines: readonly DraftLine[]): SaleLineInput[] =>
  lines.map(({ bookId, quantity }) => ({ bookId, quantity }));
