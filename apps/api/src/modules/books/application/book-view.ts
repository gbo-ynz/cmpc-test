import type { Book } from '../domain/book';

/** Output DTO of the application layer: primitives only, no domain objects leak out. */
export interface BookView {
  readonly id: string;
  readonly title: string;
  readonly authorId: string;
  readonly author: string;
  readonly publisherId: string;
  readonly publisher: string;
  readonly genreId: string;
  readonly genre: string;
  readonly price: number;
  readonly stock: number;
  /** Derived: stock > 0. */
  readonly isAvailable: boolean;
  readonly imageUrl: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toBookView(book: Book): BookView {
  const { id, title, author, publisher, genre, price, stock, imageUrl } = book.snapshot();
  const { createdAt, updatedAt } = book.snapshot();
  return {
    id,
    title,
    authorId: author.id,
    author: author.name,
    publisherId: publisher.id,
    publisher: publisher.name,
    genreId: genre.id,
    genre: genre.name,
    price: price.amount,
    stock,
    isAvailable: book.isAvailable,
    imageUrl,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}
