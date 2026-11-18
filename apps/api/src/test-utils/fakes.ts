import type { AuditEntry, AuditLogger } from '../shared/application/audit-logger.port';
import type { TransactionManager } from '../shared/application/transaction-manager.port';
import type {
  ImageStorage,
  ImageUpload,
} from '../modules/books/application/ports/image-storage.port';
import { Book } from '../modules/books/domain/book';
import type { BookData } from '../modules/books/domain/book-data';

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

export const bookData = (overrides: Partial<BookData> = {}): BookData => ({
  title: 'Rayuela',
  author: 'Julio Cortázar',
  publisher: 'Sudamericana',
  genre: 'Novela',
  price: 16990,
  isAvailable: true,
  ...overrides,
});

export const makeBook = (overrides: Partial<BookData> = {}): Book =>
  Book.create(bookData(overrides));

export const ACTOR_ID = '6f1c1d9e-1111-4c2a-9a59-0b1f6b9c0001';
