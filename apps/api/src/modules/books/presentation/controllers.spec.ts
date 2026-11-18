import { Readable } from 'node:stream';
import { StreamableFile } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import type { CreateBookUseCase } from '../application/create-book.use-case';
import type { DeleteBookUseCase } from '../application/delete-book.use-case';
import type { ExportBooksCsvUseCase } from '../application/export-books-csv.use-case';
import type { GetBookUseCase } from '../application/get-book.use-case';
import type { ListBooksUseCase } from '../application/list-books.use-case';
import type { UpdateBookUseCase } from '../application/update-book.use-case';
import type { UploadBookImageUseCase } from '../application/upload-book-image.use-case';
import { BookImageController } from './book-image.controller';
import { BooksCommandController } from './books-command.controller';
import { BooksQueryController } from './books-query.controller';
import { ListBooksQueryDto } from './dto/list-books.query.dto';

const USER: AuthenticatedUser = { id: 'u1', email: 'a@b.cl', role: 'ADMIN' };
const ID = '0b6d3c39-5b1f-4c9e-9a59-0b1f6b9c0001';
const useCase = <T>(result?: unknown) =>
  ({ execute: jest.fn().mockResolvedValue(result) }) as unknown as T & { execute: jest.Mock };

describe('BooksQueryController', () => {
  const list = useCase<ListBooksUseCase>({ items: [], meta: {} });
  const get = useCase<GetBookUseCase>({ id: ID });
  const exporter = useCase<ExportBooksCsvUseCase>(Readable.from(['csv']));
  const controller = new BooksQueryController(list, get, exporter);

  it('lists with parsed criteria', async () => {
    const dto = Object.assign(new ListBooksQueryDto(), { sort: 'price:desc' });

    await controller.list(dto);

    expect(list.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        sort: [{ field: 'price', direction: 'desc' }],
      }),
    );
  });

  it('returns a single book', async () => {
    await expect(controller.findOne(ID)).resolves.toEqual({ id: ID });
  });

  it('streams the CSV export as a file', async () => {
    const file = await controller.export({}, USER);

    expect(file).toBeInstanceOf(StreamableFile);
    expect(exporter.execute).toHaveBeenCalledWith({
      query: { filters: expect.any(Object), sort: [] },
      actorId: 'u1',
    });
  });
});

describe('BooksCommandController', () => {
  const create = useCase<CreateBookUseCase>({ id: ID });
  const update = useCase<UpdateBookUseCase>({ id: ID });
  const remove = useCase<DeleteBookUseCase>();
  const controller = new BooksCommandController(create, update, remove);
  const dto = { title: 'T', authorId: 'a', publisherId: 'p', genreId: 'g', price: 1, stock: 2 };

  it('creates, updates and deletes on behalf of the current user', async () => {
    await controller.create(dto, USER);
    await controller.update(ID, { price: 2 }, USER);
    await controller.remove(ID, USER);

    expect(create.execute).toHaveBeenCalledWith({ data: dto, actorId: 'u1' });
    expect(update.execute).toHaveBeenCalledWith({ id: ID, changes: { price: 2 }, actorId: 'u1' });
    expect(remove.execute).toHaveBeenCalledWith({ id: ID, actorId: 'u1' });
  });
});

describe('BookImageController', () => {
  it('uploads the validated image', async () => {
    const upload = useCase<UploadBookImageUseCase>({ id: ID, imageUrl: '/api/uploads/x.png' });
    const image = { buffer: Buffer.from('x'), mimeType: 'image/png' as const };

    await new BookImageController(upload).upload(ID, image, USER);

    expect(upload.execute).toHaveBeenCalledWith({ id: ID, image, actorId: 'u1' });
  });
});
