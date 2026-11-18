import {
  ACTOR_ID,
  FakeAuditLogger,
  FakeTransactionManager,
  bookData,
  makeBook,
} from '../../../test-utils/fakes';
import { InMemoryBookRepository } from '../../../test-utils/in-memory-book.repository';
import { BookNotFoundError, InvalidBookError } from '../domain/book.errors';
import { CreateBookUseCase } from './create-book.use-case';
import { DeleteBookUseCase } from './delete-book.use-case';
import { UpdateBookUseCase } from './update-book.use-case';

function setup(seed = [makeBook()]) {
  const books = new InMemoryBookRepository(seed);
  const transactions = new FakeTransactionManager();
  const audit = new FakeAuditLogger();
  return { books, transactions, audit, existing: seed[0] };
}

describe('CreateBookUseCase', () => {
  it('persists the book and audits inside one transaction', async () => {
    const { books, transactions, audit } = setup([]);
    const useCase = new CreateBookUseCase(books, transactions, audit);

    const view = await useCase.execute({
      data: bookData({ title: 'Ficciones' }),
      actorId: ACTOR_ID,
    });

    expect(view).toMatchObject({ title: 'Ficciones', price: 16990, imageUrl: null });
    expect(books.stored(view.id)).toBeDefined();
    expect(transactions.runs).toBe(1);
    expect(audit.entries[0]).toMatchObject({
      action: 'CREATE',
      entityId: view.id,
      actorId: ACTOR_ID,
    });
  });

  it('does not persist nor audit invalid books', async () => {
    const { books, transactions, audit } = setup([]);
    const useCase = new CreateBookUseCase(books, transactions, audit);

    await expect(
      useCase.execute({ data: bookData({ price: -1 }), actorId: ACTOR_ID }),
    ).rejects.toThrow(InvalidBookError);
    expect(audit.entries).toHaveLength(0);
  });
});

describe('UpdateBookUseCase', () => {
  it('applies partial changes and audits them', async () => {
    const { books, transactions, audit, existing } = setup();
    const useCase = new UpdateBookUseCase(books, transactions, audit);

    const view = await useCase.execute({
      id: existing.id,
      changes: { isAvailable: false },
      actorId: ACTOR_ID,
    });

    expect(view.isAvailable).toBe(false);
    expect(audit.entries[0]).toMatchObject({
      action: 'UPDATE',
      metadata: { changes: { isAvailable: false } },
    });
  });

  it('fails for unknown books', async () => {
    const { books, transactions, audit } = setup();
    const useCase = new UpdateBookUseCase(books, transactions, audit);

    await expect(
      useCase.execute({ id: 'missing', changes: {}, actorId: ACTOR_ID }),
    ).rejects.toThrow(BookNotFoundError);
  });
});

describe('DeleteBookUseCase', () => {
  it('soft deletes: the row stays but is no longer found', async () => {
    const { books, transactions, audit, existing } = setup();
    const useCase = new DeleteBookUseCase(books, transactions, audit);

    await useCase.execute({ id: existing.id, actorId: ACTOR_ID });

    expect(books.stored(existing.id)?.isDeleted).toBe(true);
    await expect(books.findById(existing.id)).resolves.toBeNull();
    expect(audit.entries[0]).toMatchObject({ action: 'DELETE', entityId: existing.id });
  });
});
