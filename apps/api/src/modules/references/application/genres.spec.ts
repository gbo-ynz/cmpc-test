import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/domain.error';
import { FakeAuditLogger, FakeTransactionManager } from '../../../test-utils/fakes';
import { InMemoryGenreRepository } from '../../../test-utils/in-memory-genre.repository';
import { InMemoryReferenceRepository } from '../../../test-utils/in-memory-reference.repository';
import { CreateGenreUseCase } from './create-genre.use-case';
import {
  GetGenreUseCase,
  ListGenresPageUseCase,
  ListGenresUseCase,
} from './genre-queries.use-case';
import { UpdateGenreUseCase } from './update-genre.use-case';

function setup() {
  const references = new InMemoryReferenceRepository();
  const genres = new InMemoryGenreRepository(references);
  const transactions = new FakeTransactionManager();
  const audit = new FakeAuditLogger();
  return {
    genres,
    transactions,
    audit,
    list: new ListGenresUseCase(genres),
    listPage: new ListGenresPageUseCase(genres),
    get: new GetGenreUseCase(genres),
    create: new CreateGenreUseCase(genres, references, transactions, audit),
    update: new UpdateGenreUseCase(genres, references, transactions, audit),
  };
}

describe('genre use cases', () => {
  it('creates a normalized genre with description and audits it inside a transaction', async () => {
    const { create, transactions, audit } = setup();

    const created = await create.execute({
      name: '  Ciencia   ficción ',
      description: ' Relatos del futuro. ',
      actorId: 'admin-1',
    });

    expect(created).toMatchObject({ name: 'Ciencia ficción', description: 'Relatos del futuro.' });
    expect(transactions.runs).toBe(1);
    expect(audit.entries).toEqual([
      expect.objectContaining({
        action: 'CREATE',
        entityType: 'Genre',
        metadata: { name: 'Ciencia ficción', description: 'Relatos del futuro.' },
      }),
    ]);
  });

  it('creates without description (it is optional), rejects a taken name and a long name', async () => {
    const { genres, create } = setup();
    genres.seed('Novela');

    await expect(create.execute({ name: 'Cuento', actorId: 'a' })).resolves.toMatchObject({
      description: null,
    });
    await expect(create.execute({ name: 'NOVELA', actorId: 'a' })).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(create.execute({ name: 'x'.repeat(81), actorId: 'a' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      create.execute({ name: 'Nuevo', description: 'x'.repeat(501), actorId: 'a' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('updates only what it receives and audits the previous values', async () => {
    const { genres, update, audit } = setup();
    const poetry = genres.seed('Poesía', { description: 'Obras en verso.' });

    const renamed = await update.execute({ id: poetry.id, name: 'Poesía lírica', actorId: 'a' });
    const cleared = await update.execute({ id: poetry.id, description: null, actorId: 'a' });

    expect(renamed).toEqual({
      id: poetry.id,
      name: 'Poesía lírica',
      description: 'Obras en verso.',
    });
    expect(cleared).toEqual({ id: poetry.id, name: 'Poesía lírica', description: null });
    expect(audit.entries[0]).toMatchObject({
      action: 'UPDATE',
      metadata: { previous: { name: 'Poesía', description: 'Obras en verso.' } },
    });
  });

  it('keeps names unique when renaming (own name with other casing is allowed)', async () => {
    const { genres, update } = setup();
    genres.seed('Novela');
    const essay = genres.seed('Ensayo');

    await expect(
      update.execute({ id: essay.id, name: 'ENSAYO', actorId: 'a' }),
    ).resolves.toMatchObject({ name: 'ENSAYO' });
    await expect(
      update.execute({ id: essay.id, name: 'novela', actorId: 'a' }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(update.execute({ id: essay.id, name: null, actorId: 'a' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('returns one page of genres sorted by name with pagination metadata', async () => {
    const { genres, listPage } = setup();
    ['Novela', 'Cuento', 'Poesía', 'Ensayo', 'Historia'].forEach((name) => genres.seed(name));

    const second = await listPage.execute({ page: 2, limit: 2 });

    expect(second.items.map((genre) => genre.name)).toEqual(['Historia', 'Novela']);
    expect(second.meta).toEqual({ total: 5, page: 2, limit: 2, totalPages: 3 });
    expect((await listPage.execute({ page: 9, limit: 2 })).items).toEqual([]);
  });

  it('lists with description and answers not found for an unknown id', async () => {
    const { genres, list, get, update } = setup();
    const novel = genres.seed('Novela', { description: 'Narraciones extensas.' });

    expect(await list.execute()).toEqual([{ ...novel, activeBooks: 0 }]);
    expect(await get.execute(novel.id)).toEqual(novel);
    await expect(get.execute('missing')).rejects.toBeInstanceOf(NotFoundError);
    await expect(update.execute({ id: 'missing', actorId: 'a' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
