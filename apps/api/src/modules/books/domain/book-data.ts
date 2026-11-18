import { InvalidBookError } from './book.errors';
import { Price } from './price';

export const BOOK_LIMITS = { title: 255, author: 160, publisher: 160, genre: 80 } as const;

/** Raw input coming from any driving adapter (HTTP, CLI, queue...). */
export interface BookData {
  readonly title: string;
  readonly author: string;
  readonly publisher: string;
  readonly genre: string;
  readonly price: number;
  readonly isAvailable: boolean;
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

/** Enforces every Book invariant in one place. */
export function normalizeBookData(data: BookData): NormalizedBookData {
  if (typeof data.isAvailable !== 'boolean') {
    throw new InvalidBookError('isAvailable must be a boolean');
  }
  return {
    title: requiredText(data.title, 'title', BOOK_LIMITS.title),
    author: requiredText(data.author, 'author', BOOK_LIMITS.author),
    publisher: requiredText(data.publisher, 'publisher', BOOK_LIMITS.publisher),
    genre: requiredText(data.genre, 'genre', BOOK_LIMITS.genre),
    price: Price.of(data.price),
    isAvailable: data.isAvailable,
  };
}

export function definedChanges(changes: Partial<BookData>): Partial<BookData> {
  return Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
}
