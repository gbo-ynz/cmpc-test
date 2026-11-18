import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { BOOK_ENTITY_TYPE } from '../domain/book';
import { BookRepository } from '../domain/book.repository';
import { requireBook } from './require-book';

export interface DeleteBookCommand {
  readonly id: string;
  readonly actorId: string;
}

/** Soft delete: the row is kept with `deleted_at` for audit and recovery. */
@Injectable()
export class DeleteBookUseCase {
  constructor(
    private readonly books: BookRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  execute({ id, actorId }: DeleteBookCommand): Promise<void> {
    return this.transactions.run(async () => {
      const current = await requireBook(this.books, id);
      await this.books.save(current.softDelete());
      await this.audit.record({
        action: 'DELETE',
        entityType: BOOK_ENTITY_TYPE,
        entityId: id,
        actorId,
      });
    });
  }
}
