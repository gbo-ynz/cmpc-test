import { Paginated, paginate, toSkip } from '../shared/domain/pagination';
import type { Book } from '../modules/books/domain/book';
import type { BookCriteria, BookQuery } from '../modules/books/domain/book-criteria';
import type { BookRepository } from '../modules/books/domain/book.repository';

/** Test double for the BookRepository port: proves use cases are ORM-agnostic. */
export class InMemoryBookRepository implements BookRepository {
  private readonly books = new Map<string, Book>();

  constructor(seed: Book[] = []) {
    seed.forEach((book) => this.books.set(book.id, book));
  }

  async findById(id: string): Promise<Book | null> {
    const book = this.books.get(id);
    return book && !book.isDeleted ? book : null;
  }

  async findPage(criteria: BookCriteria): Promise<Paginated<Book>> {
    const active = this.active();
    const start = toSkip(criteria);
    return paginate(active.slice(start, start + criteria.limit), active.length, criteria);
  }

  async *streamAll(_query: BookQuery): AsyncGenerator<readonly Book[]> {
    yield this.active();
  }

  async hasDuplicate(book: Book): Promise<boolean> {
    const { title, author, publisher } = book.snapshot();
    return this.active().some((other) => {
      const data = other.snapshot();
      return (
        other.id !== book.id &&
        data.title.toLowerCase() === title.toLowerCase() &&
        data.author.id === author.id &&
        data.publisher.id === publisher.id
      );
    });
  }

  async save(book: Book): Promise<Book> {
    this.books.set(book.id, book);
    return book;
  }

  stored(id: string): Book | undefined {
    return this.books.get(id);
  }

  private active(): Book[] {
    return [...this.books.values()].filter((book) => !book.isDeleted);
  }
}
