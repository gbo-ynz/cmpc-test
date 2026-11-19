import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { ReferenceRepository } from '../../references/domain/reference.repository';
import { BOOK_ENTITY_TYPE } from '../domain/book';
import { BookRepository } from '../domain/book.repository';
import { type BookInput, resolveBookInput } from './book-input';
import { BookView, toBookView } from './book-view';
import { ensureUniqueBook } from './ensure-unique-book';
import { requireBook } from './require-book';

export interface UpdateBookCommand {
  readonly id: string;
  readonly changes: Partial<BookInput>;
  readonly actorId: string;
}

@Injectable()
export class UpdateBookUseCase {
  constructor(
    private readonly books: BookRepository,
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  async execute({ id, changes, actorId }: UpdateBookCommand): Promise<BookView> {
    const resolved = await resolveBookInput(this.references, changes);
    return this.transactions.run(async () => {
      const current = await requireBook(this.books, id);
      const changed = current.update(resolved);
      await ensureUniqueBook(this.books, changed);
      const saved = await this.books.save(changed);
      await this.audit.record({
        action: 'UPDATE',
        entityType: BOOK_ENTITY_TYPE,
        entityId: id,
        actorId,
        metadata: { changes },
      });
      return toBookView(saved);
    });
  }
}
