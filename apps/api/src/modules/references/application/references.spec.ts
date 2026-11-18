import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/domain.error';
import { FakeAuditLogger, FakeTransactionManager } from '../../../test-utils/fakes';
import { InMemoryReferenceRepository } from '../../../test-utils/in-memory-reference.repository';
import { ReferenceInUseError } from '../domain/reference.errors';
import { CreateReferenceUseCase } from './create-reference.use-case';
import { DeleteReferenceUseCase } from './delete-reference.use-case';
import { ListReferencesUseCase } from './list-references.use-case';
import { RenameReferenceUseCase } from './rename-reference.use-case';

function setup() {
  const references = new InMemoryReferenceRepository();
  const transactions = new FakeTransactionManager();
  const audit = new FakeAuditLogger();
  return {
    references,
    transactions,
    audit,
    list: new ListReferencesUseCase(references),
    create: new CreateReferenceUseCase(references, transactions, audit),
    rename: new RenameReferenceUseCase(references, transactions, audit),
    remove: new DeleteReferenceUseCase(references, transactions, audit),
  };
}

describe('reference use cases', () => {
  it('lists a kind sorted by name with its active books', async () => {
    const { references, list } = setup();
    references.seed('genres', 'Poesía', { active: 2, total: 2 });
    references.seed('genres', 'Ensayo');
    references.seed('authors', 'Borges');

    expect(await list.execute('genres')).toEqual([
      expect.objectContaining({ name: 'Ensayo', activeBooks: 0 }),
      expect.objectContaining({ name: 'Poesía', activeBooks: 2 }),
    ]);
  });

  it('creates a normalized name and audits it inside a transaction', async () => {
    const { create, transactions, audit } = setup();

    const created = await create.execute({
      kind: 'authors',
      name: '  Julio   Cortázar ',
      actorId: 'u1',
    });

    expect(created.name).toBe('Julio Cortázar');
    expect(transactions.runs).toBe(1);
    expect(audit.entries).toEqual([
      expect.objectContaining({
        action: 'CREATE',
        entityType: 'Author',
        entityId: created.id,
        actorId: 'u1',
      }),
    ]);
  });

  it('validates the name with the limit of each kind', async () => {
    const { create } = setup();

    await expect(create.execute({ kind: 'genres', name: '  ', actorId: 'u1' })).rejects.toThrow(
      ValidationError,
    );
    await expect(
      create.execute({ kind: 'genres', name: 'x'.repeat(81), actorId: 'u1' }),
    ).rejects.toThrow(ValidationError);
    await expect(
      create.execute({ kind: 'authors', name: 'x'.repeat(81), actorId: 'u1' }),
    ).resolves.toBeDefined();
  });

  it('rejects a duplicate name ignoring case and audits nothing', async () => {
    const { references, create, audit } = setup();
    references.seed('genres', 'Novela');

    await expect(create.execute({ kind: 'genres', name: 'novela', actorId: 'u1' })).rejects.toThrow(
      ConflictError,
    );
    expect(audit.entries).toEqual([]);
  });

  it('renames, allowing a casing change of its own name, and audits the previous one', async () => {
    const { references, rename, audit } = setup();
    const genre = references.seed('genres', 'novela');

    const renamed = await rename.execute({
      kind: 'genres',
      id: genre.id,
      name: 'Novela',
      actorId: 'u1',
    });

    expect(renamed.name).toBe('Novela');
    expect(audit.entries[0]).toMatchObject({
      action: 'UPDATE',
      metadata: { name: 'Novela', previousName: 'novela' },
    });
  });

  it('refuses to rename onto another existing name or an unknown record', async () => {
    const { references, rename } = setup();
    references.seed('genres', 'Ensayo');
    const genre = references.seed('genres', 'Novela');

    await expect(
      rename.execute({ kind: 'genres', id: genre.id, name: 'ensayo', actorId: 'u1' }),
    ).rejects.toThrow(ConflictError);
    await expect(
      rename.execute({ kind: 'genres', id: 'missing', name: 'X', actorId: 'u1' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('deletes a record without books and audits it', async () => {
    const { references, remove, audit } = setup();
    const author = references.seed('authors', 'Sin libros');

    await remove.execute({ kind: 'authors', id: author.id, actorId: 'u1' });

    expect(await references.findById('authors', author.id)).toBeNull();
    expect(audit.entries[0]).toMatchObject({ action: 'DELETE', entityType: 'Author' });
  });

  it('refuses to delete a record with books, even soft-deleted ones, telling how many', async () => {
    const { references, remove, audit } = setup();
    const publisher = references.seed('publishers', 'Sur', { active: 0, total: 3 });

    const failure = remove.execute({ kind: 'publishers', id: publisher.id, actorId: 'u1' });

    await expect(failure).rejects.toThrow(ReferenceInUseError);
    await expect(failure).rejects.toMatchObject({ books: 3 });
    expect(await references.findById('publishers', publisher.id)).not.toBeNull();
    expect(audit.entries).toEqual([]);
  });
});
