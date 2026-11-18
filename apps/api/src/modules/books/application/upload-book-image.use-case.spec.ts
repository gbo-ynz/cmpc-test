import { Logger } from '@nestjs/common';
import {
  ACTOR_ID,
  FakeAuditLogger,
  FakeImageStorage,
  FakeTransactionManager,
  makeBook,
} from '../../../test-utils/fakes';
import { InMemoryBookRepository } from '../../../test-utils/in-memory-book.repository';
import { BookNotFoundError } from '../domain/book.errors';
import type { ImageUpload } from './ports/image-storage.port';
import { UploadBookImageUseCase } from './upload-book-image.use-case';

const IMAGE: ImageUpload = { buffer: Buffer.from('png'), mimeType: 'image/png' };

function setup(seed = makeBook()) {
  const books = new InMemoryBookRepository([seed]);
  const storage = new FakeImageStorage();
  const audit = new FakeAuditLogger();
  const useCase = new UploadBookImageUseCase(books, storage, new FakeTransactionManager(), audit);
  return { useCase, books, storage, audit, book: seed };
}

describe('UploadBookImageUseCase', () => {
  afterEach(() => jest.restoreAllMocks());

  it('stores the image, links it to the book and audits', async () => {
    const { useCase, storage, audit, book } = setup();

    const view = await useCase.execute({ id: book.id, image: IMAGE, actorId: ACTOR_ID });

    expect(view.imageUrl).toBe('/api/uploads/fake-1.png');
    expect(storage.saved).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({ action: 'UPLOAD_IMAGE', entityId: book.id });
  });

  it('removes the previous image when replacing it', async () => {
    const { useCase, storage, book } = setup(makeBook().attachImage('/api/uploads/old.png'));

    await useCase.execute({ id: book.id, image: IMAGE, actorId: ACTOR_ID });

    expect(storage.removed).toEqual(['/api/uploads/old.png']);
  });

  it('does not store anything when the book does not exist', async () => {
    const { useCase, storage } = setup();

    await expect(
      useCase.execute({ id: 'missing', image: IMAGE, actorId: ACTOR_ID }),
    ).rejects.toThrow(BookNotFoundError);
    expect(storage.saved).toHaveLength(0);
  });

  it('compensates by deleting the new file when persistence fails', async () => {
    const { useCase, books, storage, book } = setup();
    jest.spyOn(books, 'save').mockRejectedValue(new Error('db down'));

    await expect(useCase.execute({ id: book.id, image: IMAGE, actorId: ACTOR_ID })).rejects.toThrow(
      'db down',
    );
    expect(storage.removed).toEqual(['/api/uploads/fake-1.png']);
  });

  it('logs but tolerates cleanup failures', async () => {
    const { useCase, storage, book } = setup(makeBook().attachImage('/api/uploads/old.png'));
    jest.spyOn(storage, 'remove').mockRejectedValue(new Error('EACCES'));
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await expect(
      useCase.execute({ id: book.id, image: IMAGE, actorId: ACTOR_ID }),
    ).resolves.toBeDefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('old.png'));
  });
});
