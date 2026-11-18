import type { Book } from '../domain/book';

/** Output DTO of the application layer: primitives only, no domain objects leak out. */
export interface BookView {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly publisher: string;
  readonly genre: string;
  readonly price: number;
  readonly isAvailable: boolean;
  readonly imageUrl: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toBookView(book: Book): BookView {
  const { id, title, author, publisher, genre, price, isAvailable, imageUrl } = book.snapshot();
  const { createdAt, updatedAt } = book.snapshot();
  return {
    id,
    title,
    author,
    publisher,
    genre,
    price: price.amount,
    isAvailable,
    imageUrl,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}
