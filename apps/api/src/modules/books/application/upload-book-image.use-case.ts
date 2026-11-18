import { Injectable, Logger } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { BOOK_ENTITY_TYPE, Book } from '../domain/book';
import { BookRepository } from '../domain/book.repository';
import { BookView, toBookView } from './book-view';
import { ImageStorage, ImageUpload } from './ports/image-storage.port';
import { requireBook } from './require-book';

export interface UploadBookImageCommand {
  readonly id: string;
  readonly image: ImageUpload;
  readonly actorId: string;
}

@Injectable()
export class UploadBookImageUseCase {
  private readonly logger = new Logger(UploadBookImageUseCase.name);

  constructor(
    private readonly books: BookRepository,
    private readonly storage: ImageStorage,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  async execute({ id, image, actorId }: UploadBookImageCommand): Promise<BookView> {
    const current = await requireBook(this.books, id);
    const imageUrl = await this.storage.save(image);
    try {
      const saved = await this.transactions.run(() => this.persist(current, imageUrl, actorId));
      await this.discard(current.snapshot().imageUrl);
      return toBookView(saved);
    } catch (error) {
      await this.discard(imageUrl); // compensate: no orphan files when the DB write fails
      throw error;
    }
  }

  private async persist(book: Book, imageUrl: string, actorId: string): Promise<Book> {
    const saved = await this.books.save(book.attachImage(imageUrl));
    const entry = { entityType: BOOK_ENTITY_TYPE, entityId: book.id, actorId };
    await this.audit.record({ ...entry, action: 'UPLOAD_IMAGE', metadata: { imageUrl } });
    return saved;
  }

  private async discard(url: string | null): Promise<void> {
    if (!url) return;
    await this.storage.remove(url).catch((error: unknown) => {
      this.logger.warn(`Could not remove image ${url}: ${String(error)}`);
    });
  }
}
