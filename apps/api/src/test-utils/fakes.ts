import type { AuditEntry, AuditLogger } from '../shared/application/audit-logger.port';
import type { TransactionManager } from '../shared/application/transaction-manager.port';
import type {
  ImageStorage,
  ImageUpload,
} from '../modules/books/application/ports/image-storage.port';
import { Book } from '../modules/books/domain/book';
import type { BookInput } from '../modules/books/application/book-input';
import type { BookData } from '../modules/books/domain/book-data';
import { InMemoryReferenceRepository } from './in-memory-reference.repository';

export class FakeTransactionManager implements TransactionManager {
  runs = 0;

  run<T>(work: () => Promise<T>): Promise<T> {
    this.runs += 1;
    return work();
  }
}

export class FakeAuditLogger implements AuditLogger {
  readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}

export class FakeImageStorage implements ImageStorage {
  readonly saved: ImageUpload[] = [];
  readonly removed: string[] = [];

  async save(image: ImageUpload): Promise<string> {
    this.saved.push(image);
    return `/api/uploads/fake-${this.saved.length}.png`;
  }

  async remove(url: string): Promise<void> {
    this.removed.push(url);
  }
}

/** Catalog records a test book points to (ids are what the HTTP layer sends). */
export const REFERENCES = {
  author: { id: '0a1b2c3d-0000-4000-8000-000000000001', name: 'Julio Cortázar' },
  publisher: { id: '0a1b2c3d-0000-4000-8000-000000000002', name: 'Sudamericana' },
  genre: { id: '0a1b2c3d-0000-4000-8000-000000000003', name: 'Novela' },
} as const;

export const bookData = (overrides: Partial<BookData> = {}): BookData => ({
  title: 'Rayuela',
  ...REFERENCES,
  price: 16990,
  stock: 5,
  ...overrides,
});

export const makeBook = (overrides: Partial<BookData> = {}): Book =>
  Book.create(bookData(overrides));

/** What the HTTP layer sends for the default test book: ids instead of names. */
export const bookInput = (overrides: Partial<BookInput> = {}): BookInput => ({
  title: 'Rayuela',
  authorId: REFERENCES.author.id,
  publisherId: REFERENCES.publisher.id,
  genreId: REFERENCES.genre.id,
  price: 16990,
  stock: 5,
  ...overrides,
});

/** A catalog fake that already holds the default test references. */
export function seededReferences(): InMemoryReferenceRepository {
  const references = new InMemoryReferenceRepository();
  references.seed('authors', REFERENCES.author.name, undefined, REFERENCES.author.id);
  references.seed('publishers', REFERENCES.publisher.name, undefined, REFERENCES.publisher.id);
  references.seed('genres', REFERENCES.genre.name, undefined, REFERENCES.genre.id);
  return references;
}

export const ACTOR_ID = '6f1c1d9e-1111-4c2a-9a59-0b1f6b9c0001';
