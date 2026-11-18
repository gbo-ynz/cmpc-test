import { FakeAuditLogger, FakeTransactionManager } from '../../../test-utils/fakes';
import { InMemoryReferenceRepository } from '../../../test-utils/in-memory-reference.repository';
import { ReferenceInUseError } from '../domain/reference.errors';
import { DeleteReferenceUseCase } from './delete-reference.use-case';

function setup() {
  const references = new InMemoryReferenceRepository();
  const audit = new FakeAuditLogger();
  const remove = new DeleteReferenceUseCase(references, new FakeTransactionManager(), audit);
  return { references, audit, remove };
}

describe('delete reference use case', () => {
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
