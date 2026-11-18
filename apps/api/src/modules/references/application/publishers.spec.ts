import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/domain.error';
import { FakeAuditLogger, FakeTransactionManager } from '../../../test-utils/fakes';
import { InMemoryPublisherRepository } from '../../../test-utils/in-memory-publisher.repository';
import { InMemoryReferenceRepository } from '../../../test-utils/in-memory-reference.repository';
import { CreatePublisherUseCase } from './create-publisher.use-case';
import {
  GetPublisherUseCase,
  ListPublishersPageUseCase,
  ListPublishersUseCase,
} from './publisher-queries.use-case';
import { UpdatePublisherUseCase } from './update-publisher.use-case';

function setup() {
  const references = new InMemoryReferenceRepository();
  const publishers = new InMemoryPublisherRepository(references);
  const transactions = new FakeTransactionManager();
  const audit = new FakeAuditLogger();
  return {
    publishers,
    transactions,
    audit,
    list: new ListPublishersUseCase(publishers),
    listPage: new ListPublishersPageUseCase(publishers),
    get: new GetPublisherUseCase(publishers),
    create: new CreatePublisherUseCase(publishers, references, transactions, audit),
    update: new UpdatePublisherUseCase(publishers, references, transactions, audit),
  };
}

describe('publisher use cases', () => {
  it('creates a normalized publisher with country and audits it inside a transaction', async () => {
    const { create, transactions, audit } = setup();

    const created = await create.execute({
      name: '  Fondo   de Cultura ',
      country: ' México ',
      actorId: 'admin-1',
    });

    expect(created).toMatchObject({ name: 'Fondo de Cultura', country: 'México' });
    expect(transactions.runs).toBe(1);
    expect(audit.entries).toEqual([
      expect.objectContaining({
        action: 'CREATE',
        entityType: 'Publisher',
        metadata: { name: 'Fondo de Cultura', country: 'México' },
      }),
    ]);
  });

  it('creates without country (it is optional) and rejects a taken name', async () => {
    const { publishers, create } = setup();
    publishers.seed('Sur');

    await expect(create.execute({ name: 'Losada', actorId: 'a' })).resolves.toMatchObject({
      country: null,
    });
    await expect(create.execute({ name: 'SUR', actorId: 'a' })).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(
      create.execute({ name: 'Nueva', country: 'x'.repeat(81), actorId: 'a' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('updates only what it receives and audits the previous values', async () => {
    const { publishers, update, audit } = setup();
    const sur = publishers.seed('Sur', { country: 'Argentina' });

    const renamed = await update.execute({ id: sur.id, name: 'Sur Editorial', actorId: 'a' });
    const cleared = await update.execute({ id: sur.id, country: null, actorId: 'a' });

    expect(renamed).toEqual({ id: sur.id, name: 'Sur Editorial', country: 'Argentina' });
    expect(cleared).toEqual({ id: sur.id, name: 'Sur Editorial', country: null });
    expect(audit.entries[0]).toMatchObject({
      action: 'UPDATE',
      metadata: { previous: { name: 'Sur', country: 'Argentina' } },
    });
  });

  it('keeps names unique when renaming (own name with other casing is allowed)', async () => {
    const { publishers, update } = setup();
    publishers.seed('Sur');
    const losada = publishers.seed('Losada');

    await expect(
      update.execute({ id: losada.id, name: 'LOSADA', actorId: 'a' }),
    ).resolves.toMatchObject({ name: 'LOSADA' });
    await expect(
      update.execute({ id: losada.id, name: 'sur', actorId: 'a' }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      update.execute({ id: losada.id, name: null, actorId: 'a' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('returns one page of publishers sorted by name with pagination metadata', async () => {
    const { publishers, listPage } = setup();
    ['Sur', 'Anagrama', 'Losada', 'Debate', 'Minotauro'].forEach((name) => publishers.seed(name));

    const second = await listPage.execute({ page: 2, limit: 2 });

    expect(second.items.map((publisher) => publisher.name)).toEqual(['Losada', 'Minotauro']);
    expect(second.meta).toEqual({ total: 5, page: 2, limit: 2, totalPages: 3 });
    expect((await listPage.execute({ page: 9, limit: 2 })).items).toEqual([]);
  });

  it('lists with country and answers not found for an unknown id', async () => {
    const { publishers, list, get, update } = setup();
    const sur = publishers.seed('Sur', { country: 'Argentina' });

    expect(await list.execute()).toEqual([{ ...sur, activeBooks: 0 }]);
    expect(await get.execute(sur.id)).toEqual(sur);
    await expect(get.execute('missing')).rejects.toBeInstanceOf(NotFoundError);
    await expect(update.execute({ id: 'missing', actorId: 'a' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
