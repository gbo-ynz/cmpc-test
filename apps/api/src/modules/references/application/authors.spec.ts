import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/domain.error';
import { FakeAuditLogger, FakeTransactionManager } from '../../../test-utils/fakes';
import { InMemoryAuthorRepository } from '../../../test-utils/in-memory-author.repository';
import { InMemoryReferenceRepository } from '../../../test-utils/in-memory-reference.repository';
import {
  GetAuthorUseCase,
  ListAuthorsPageUseCase,
  ListAuthorsUseCase,
} from './author-queries.use-case';
import { CreateAuthorUseCase } from './create-author.use-case';
import { UpdateAuthorUseCase } from './update-author.use-case';

function setup() {
  const references = new InMemoryReferenceRepository();
  const authors = new InMemoryAuthorRepository(references);
  const transactions = new FakeTransactionManager();
  const audit = new FakeAuditLogger();
  return {
    authors,
    transactions,
    audit,
    list: new ListAuthorsUseCase(authors),
    listPage: new ListAuthorsPageUseCase(authors),
    get: new GetAuthorUseCase(authors),
    create: new CreateAuthorUseCase(authors, references, transactions, audit),
    update: new UpdateAuthorUseCase(authors, references, transactions, audit),
  };
}

describe('author use cases', () => {
  it('creates a normalized author with details and audits it inside a transaction', async () => {
    const { create, transactions, audit } = setup();

    const created = await create.execute({
      name: '  Gabriela   Mistral ',
      birthDate: '1889-04-07',
      biography: ' Poeta. ',
      actorId: 'admin-1',
    });

    expect(created).toMatchObject({
      name: 'Gabriela Mistral',
      birthDate: '1889-04-07',
      biography: 'Poeta.',
    });
    expect(transactions.runs).toBe(1);
    expect(audit.entries).toEqual([
      expect.objectContaining({
        action: 'CREATE',
        entityType: 'Author',
        metadata: { name: 'Gabriela Mistral', birthDate: '1889-04-07', biography: 'Poeta.' },
      }),
    ]);
  });

  it('creates without details (they are optional) and rejects a taken name or a future date', async () => {
    const { authors, create } = setup();
    authors.seed('Borges');

    await expect(create.execute({ name: 'Sabato', actorId: 'a' })).resolves.toMatchObject({
      birthDate: null,
      biography: null,
    });
    await expect(create.execute({ name: 'BORGES', actorId: 'a' })).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(
      create.execute({ name: 'Nuevo', birthDate: '2999-01-01', actorId: 'a' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('updates only what it receives and audits the previous values', async () => {
    const { authors, update, audit } = setup();
    const borges = authors.seed('Borges', { birthDate: '1899-08-24', biography: 'Cuentista.' });

    const updated = await update.execute({
      id: borges.id,
      biography: 'Poeta y cuentista.',
      actorId: 'a',
    });

    expect(updated).toEqual({ ...borges, biography: 'Poeta y cuentista.' });
    expect(audit.entries[0]).toMatchObject({
      action: 'UPDATE',
      metadata: { previous: { name: 'Borges', birthDate: '1899-08-24', biography: 'Cuentista.' } },
    });
  });

  it('renames keeping uniqueness (the same name with other casing is allowed)', async () => {
    const { authors, update } = setup();
    authors.seed('Borges');
    const sabato = authors.seed('Sabato');

    await expect(
      update.execute({ id: sabato.id, name: 'SABATO', actorId: 'a' }),
    ).resolves.toMatchObject({
      name: 'SABATO',
    });
    await expect(
      update.execute({ id: sabato.id, name: 'borges', actorId: 'a' }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      update.execute({ id: sabato.id, name: null, actorId: 'a' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('returns one page of authors sorted by name with pagination metadata', async () => {
    const { authors, listPage } = setup();
    ['Cortázar', 'Allende', 'Borges', 'Donoso', 'Bolaño'].forEach((name) => authors.seed(name));

    const second = await listPage.execute({ page: 2, limit: 2 });

    expect(second.items.map((author) => author.name)).toEqual(['Borges', 'Cortázar']);
    expect(second.meta).toEqual({ total: 5, page: 2, limit: 2, totalPages: 3 });
    expect((await listPage.execute({ page: 9, limit: 2 })).items).toEqual([]);
  });

  it('lists with details and answers not found for an unknown id', async () => {
    const { authors, list, get, update } = setup();
    const borges = authors.seed('Borges', { birthDate: '1899-08-24' });

    expect(await list.execute()).toEqual([{ ...borges, activeBooks: 0 }]);
    expect(await get.execute(borges.id)).toEqual(borges);
    await expect(get.execute('missing')).rejects.toBeInstanceOf(NotFoundError);
    await expect(update.execute({ id: 'missing', actorId: 'a' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
