import { Book } from '../../domain/book';
import { DuplicateBookError } from '../../domain/book.errors';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { PrismaBookRepository } from './prisma-book.repository';

// The tests run in order and share the database.
let db: TestDatabase;
let prisma: PrismaService;
let repository: PrismaBookRepository;
let refs: Record<'author' | 'publisher' | 'genre' | 'otherAuthor', { id: string; name: string }>;

beforeAll(async () => {
  db = await startTestDatabase();
  process.env.DATABASE_URL = db.url;
  prisma = new PrismaService();
  repository = new PrismaBookRepository(prisma);
  refs = {
    author: await db.prisma.author.create({ data: { name: 'Eric Evans' } }),
    otherAuthor: await db.prisma.author.create({ data: { name: 'Otro' } }),
    publisher: await db.prisma.publisher.create({ data: { name: 'Addison-Wesley' } }),
    genre: await db.prisma.genre.create({ data: { name: 'Tecnología' } }),
  };
});

afterAll(async () => {
  await prisma.onModuleDestroy();
  await db.stop();
});

const ddd = (title = 'Domain-Driven Design', author = refs.author) =>
  Book.create({
    title,
    author,
    publisher: refs.publisher,
    genre: refs.genre,
    price: 42990,
    stock: 1,
  });

it('finds another active book with the same title (ignoring case), author and publisher', async () => {
  const saved = await repository.save(ddd());

  expect(await repository.hasDuplicate(ddd('domain-driven DESIGN'))).toBe(true);
  expect(await repository.hasDuplicate(saved)).toBe(false); // a book never duplicates itself
  expect(await repository.hasDuplicate(ddd('Domain-Driven Design', refs.otherAuthor))).toBe(false);
});

it('rejects a duplicate at the database level even if the check was skipped (concurrent requests)', async () => {
  await expect(repository.save(ddd('DOMAIN-DRIVEN DESIGN'))).rejects.toThrow(DuplicateBookError);
});

it('lets a soft-deleted book be loaded again', async () => {
  const [original] = await db.prisma.book.findMany({ where: { title: 'Domain-Driven Design' } });
  await db.prisma.book.update({ where: { id: original.id }, data: { deletedAt: new Date() } });

  await expect(repository.save(ddd())).resolves.toBeInstanceOf(Book);
  expect(await db.prisma.book.count({ where: { title: 'Domain-Driven Design' } })).toBe(2);
});
