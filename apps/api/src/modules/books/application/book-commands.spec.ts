import {
  ACTOR_ID,
  FakeAuditLogger,
  FakeTransactionManager,
  bookInput,
  makeBook,
  seededReferences,
} from '../../../test-utils/fakes';
import { InMemoryBookRepository } from '../../../test-utils/in-memory-book.repository';
import { BookNotFoundError, InvalidBookError } from '../domain/book.errors';
import { CreateBookUseCase } from './create-book.use-case';
import { DeleteBookUseCase } from './delete-book.use-case';
import { UpdateBookUseCase } from './update-book.use-case';

function setup(seed = [makeBook()]) {
  const books = new InMemoryBookRepository(seed);
  const references = seededReferences();
  const transactions = new FakeTransactionManager();
  const audit = new FakeAuditLogger();
  const create = new CreateBookUseCase(books, references, transactions, audit);
  const update = new UpdateBookUseCase(books, references, transactions, audit);
  return { books, references, transactions, audit, create, update, existing: seed[0] };
}

describe('CreateBookUseCase', () => {
  it('resolves the catalog ids, persists the book and audits inside one transaction', async () => {
    const { books, transactions, audit, create } = setup([]);

    const view = await create.execute({
      data: bookInput({ title: 'Ficciones' }),
      actorId: ACTOR_ID,
    });

    expect(view).toMatchObject({
      title: 'Ficciones',
      author: 'Julio Cortázar',
      genre: 'Novela',
      stock: 5,
      isAvailable: true,
    });
    expect(books.stored(view.id)).toBeDefined();
    expect(transactions.runs).toBe(1);
    expect(audit.entries[0]).toMatchObject({
      action: 'CREATE',
      entityId: view.id,
      actorId: ACTOR_ID,
    });
  });

  it('rejects an unknown author, publisher or genre without persisting anything', async () => {
    const { create, audit } = setup([]);
    const unknown = '0a1b2c3d-0000-4000-8000-0000000000ff';

    await expect(
      create.execute({ data: bookInput({ genreId: unknown }), actorId: ACTOR_ID }),
    ).rejects.toThrow(InvalidBookError);
    expect(audit.entries).toHaveLength(0);
  });

  it('does not persist nor audit invalid books', async () => {
    const { create, audit } = setup([]);

    await expect(
      create.execute({ data: bookInput({ price: -1 }), actorId: ACTOR_ID }),
    ).rejects.toThrow(InvalidBookError);
    await expect(
      create.execute({ data: bookInput({ stock: 1.5 }), actorId: ACTOR_ID }),
    ).rejects.toThrow(InvalidBookError);
    expect(audit.entries).toHaveLength(0);
  });
});

describe('UpdateBookUseCase', () => {
  it('applies partial changes: with no stock the book is no longer available', async () => {
    const { audit, update, existing } = setup();

    const view = await update.execute({
      id: existing.id,
      changes: { stock: 0 },
      actorId: ACTOR_ID,
    });

    expect(view).toMatchObject({ stock: 0, isAvailable: false });
    expect(audit.entries[0]).toMatchObject({
      action: 'UPDATE',
      metadata: { changes: { stock: 0 } },
    });
  });

  it('moves the book to another existing genre', async () => {
    const { references, update, existing } = setup();
    const poetry = references.seed('genres', 'Poesía');

    const view = await update.execute({
      id: existing.id,
      changes: { genreId: poetry.id },
      actorId: ACTOR_ID,
    });

    expect(view).toMatchObject({ genreId: poetry.id, genre: 'Poesía' });
  });

  it('fails for unknown books', async () => {
    const { update } = setup();

    await expect(update.execute({ id: 'missing', changes: {}, actorId: ACTOR_ID })).rejects.toThrow(
      BookNotFoundError,
    );
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
