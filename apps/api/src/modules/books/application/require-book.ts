import type { Book } from '../domain/book';
import { BookNotFoundError } from '../domain/book.errors';
import type { BookRepository } from '../domain/book.repository';

export async function requireBook(books: BookRepository, id: string): Promise<Book> {
  const book = await books.findById(id);
  if (!book) throw new BookNotFoundError(id);
  return book;
}
