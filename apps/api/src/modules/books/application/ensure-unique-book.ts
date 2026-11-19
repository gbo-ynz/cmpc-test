import type { Book } from '../domain/book';
import { DuplicateBookError } from '../domain/book.errors';
import type { BookRepository } from '../domain/book.repository';

/** Friendly 409 before writing; the database unique index still guards concurrent requests. */
export async function ensureUniqueBook(books: BookRepository, book: Book): Promise<void> {
  if (await books.hasDuplicate(book)) throw new DuplicateBookError(book.snapshot().title);
}
