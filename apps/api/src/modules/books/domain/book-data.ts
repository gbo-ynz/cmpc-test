import type { Reference } from '../../references/domain/reference';
import { InvalidBookError } from './book.errors';
import { Price } from './price';

export const BOOK_LIMITS = { title: 255, stock: 1_000_000 } as const;

/** Domain input: the author, publisher and genre are existing catalog records, never free text. */
export interface BookData {
  readonly title: string;
  readonly author: Reference;
  readonly publisher: Reference;
  readonly genre: Reference;
  readonly price: number;
  readonly stock: number;
}

export interface NormalizedBookData extends Omit<BookData, 'price'> {
  readonly price: Price;
}

export function requiredText(value: string | undefined, field: string, maxLength: number): string {
  const text = value?.trim() ?? '';
  if (text.length === 0) throw new InvalidBookError(`${field} is required`);
  if (text.length > maxLength) {
    throw new InvalidBookError(`${field} must be at most ${maxLength} characters`);
  }
  return text;
}

function requiredReference(reference: Reference | undefined, field: string): Reference {
  if (!reference?.id) throw new InvalidBookError(`${field} is required`);
  return reference;
}

function validStock(stock: number): number {
  if (!Number.isInteger(stock) || stock < 0 || stock > BOOK_LIMITS.stock) {
    throw new InvalidBookError(`stock must be a whole number between 0 and ${BOOK_LIMITS.stock}`);
  }
  return stock;
}

/** Enforces every Book invariant in one place. */
export function normalizeBookData(data: BookData): NormalizedBookData {
  return {
    title: requiredText(data.title, 'title', BOOK_LIMITS.title),
    author: requiredReference(data.author, 'author'),
    publisher: requiredReference(data.publisher, 'publisher'),
    genre: requiredReference(data.genre, 'genre'),
    price: Price.of(data.price),
    stock: validStock(data.stock),
  };
}

export function definedChanges<T extends object>(changes: Partial<T>): Partial<T> {
  return Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
