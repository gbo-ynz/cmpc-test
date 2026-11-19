import {
  ACTOR_ID,
  FakeAuditLogger,
  FakeTransactionManager,
  bookInput,
  makeBook,
  seededReferences,
} from '../../../test-utils/fakes';
import { InMemoryBookRepository } from '../../../test-utils/in-memory-book.repository';
import { BookNotFoundError, DuplicateBookError, InvalidBookError } from '../domain/book.errors';
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

  it('audits the previous value of every field it changes, and only those', async () => {
    const { audit, update, references, existing } = setup();
    const poetry = references.seed('genres', 'Poesía');
    const before = existing.snapshot();

    await update.execute({
      id: existing.id,
      changes: { price: 9990, genreId: poetry.id },
      actorId: ACTOR_ID,
    });

    expect(audit.entries[0]?.metadata).toEqual({
      changes: { price: 9990, genreId: poetry.id },
      previous: { price: before.price.amount, genreId: before.genre.id },
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

describe('duplicate books (same title, author and publisher)', () => {
  it('rejects the same book ignoring case and extra spaces, without persisting or auditing', async () => {
    const { create, books, audit } = setup();

    await expect(
      create.execute({ data: bookInput({ title: '  rAYUELA ' }), actorId: ACTOR_ID }),
    ).rejects.toThrow(DuplicateBookError);
    expect(audit.entries).toHaveLength(0);
    expect(
      (await books.findPage({ page: 1, limit: 10, filters: {}, sort: [] })).items,
    ).toHaveLength(1);
  });

  it('allows the same title by another author or publisher', async () => {
    const { create, references } = setup();
    const otherAuthor = references.seed('authors', 'Otro autor');
    const otherPublisher = references.seed('publishers', 'Otra editorial');

    await create.execute({ data: bookInput({ authorId: otherAuthor.id }), actorId: ACTOR_ID });
    await create.execute({
      data: bookInput({ publisherId: otherPublisher.id }),
      actorId: ACTOR_ID,
    });
  });

  it('lets a deleted book be loaded again', async () => {
    const { create } = setup([makeBook().softDelete()]);

    await expect(create.execute({ data: bookInput(), actorId: ACTOR_ID })).resolves.toMatchObject({
      title: 'Rayuela',
    });
  });

  it('rejects editing a book into another existing one, but not saving a book unchanged', async () => {
    const other = makeBook({ title: 'Ficciones' });
    const { update, existing } = setup([makeBook(), other]);

    await expect(
      update.execute({ id: other.id, changes: { title: 'Rayuela' }, actorId: ACTOR_ID }),
    ).rejects.toThrow(DuplicateBookError);
    await expect(
      update.execute({ id: existing.id, changes: { price: 9990 }, actorId: ACTOR_ID }),
    ).resolves.toMatchObject({ price: 9990 });
  });

  it('stores the title with inner spaces collapsed', async () => {
    const { create } = setup([]);

    const created = await create.execute({
      data: bookInput({ title: ' Cien   años  ' }),
      actorId: ACTOR_ID,
    });

    expect(created.title).toBe('Cien años');
  });
});
