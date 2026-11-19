import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { ReferenceRepository } from '../../references/domain/reference.repository';
import { BOOK_ENTITY_TYPE, Book } from '../domain/book';
import type { BookData } from '../domain/book-data';
import { BookRepository } from '../domain/book.repository';
import { type BookInput, resolveBookInput } from './book-input';
import { BookView, toBookView } from './book-view';
import { ensureUniqueBook } from './ensure-unique-book';

export interface CreateBookCommand {
  readonly data: BookInput;
  readonly actorId: string;
}

@Injectable()
export class CreateBookUseCase {
  constructor(
    private readonly books: BookRepository,
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  /** Book + audit entry commit atomically; author, publisher and genre must already exist. */
  async execute({ data, actorId }: CreateBookCommand): Promise<BookView> {
    const book = Book.create((await resolveBookInput(this.references, data)) as BookData);
    return this.transactions.run(async () => {
      await ensureUniqueBook(this.books, book);
      const saved = await this.books.save(book);
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
