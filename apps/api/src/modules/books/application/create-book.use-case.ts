import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { BOOK_ENTITY_TYPE, Book } from '../domain/book';
import type { BookData } from '../domain/book-data';
import { BookRepository } from '../domain/book.repository';
import { BookView, toBookView } from './book-view';

export interface CreateBookCommand {
  readonly data: BookData;
  readonly actorId: string;
}

@Injectable()
export class CreateBookUseCase {
  constructor(
    private readonly books: BookRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  /** Book + author/publisher/genre upserts + audit entry commit atomically. */
  execute({ data, actorId }: CreateBookCommand): Promise<BookView> {
    return this.transactions.run(async () => {
      const saved = await this.books.save(Book.create(data));
      await this.audit.record({
        action: 'CREATE',
        entityType: BOOK_ENTITY_TYPE,
        entityId: saved.id,
        actorId,
        metadata: { title: saved.snapshot().title },
      });
      return toBookView(saved);
    });
  }
}
