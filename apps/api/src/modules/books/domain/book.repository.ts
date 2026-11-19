import type { Paginated } from '../../../shared/domain/pagination';
import type { Book } from './book';
import type { BookCriteria, BookQuery } from './book-criteria';

/**
 * Persistence port for the Book aggregate. Implementations live in
 * infrastructure (Prisma today); swapping the ORM never touches this file.
 */
export abstract class BookRepository {
  /** Returns null for missing or soft-deleted books. */
  abstract findById(id: string): Promise<Book | null>;

  abstract findPage(criteria: BookCriteria): Promise<Paginated<Book>>;

  /** Streams every matching book in batches (used by exports). */
  abstract streamAll(query: BookQuery): AsyncIterable<readonly Book[]>;

  /** Whether ANOTHER active book has the same title (ignoring case), author and publisher. */
  abstract hasDuplicate(book: Book): Promise<boolean>;

  /** Inserts or updates the aggregate and returns the persisted state. */
  abstract save(book: Book): Promise<Book>;
}
