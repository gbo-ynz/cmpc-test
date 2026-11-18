import type { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { PrismaCatalogRepository } from './prisma-catalog.repository';

interface References {
  readonly author: string;
  readonly publisher: string;
  readonly genre: string;
}

const ACTIVE: References = {
  author: 'Autor activo',
  publisher: 'Editorial activa',
  genre: 'Novela',
};
const ORPHAN: References = {
  author: 'Autor eliminado',
  publisher: 'Editorial eliminada',
  genre: 'Ensayo',
};

const named = (name: string) => ({ connectOrCreate: { where: { name }, create: { name } } });
const names = (items: ReadonlyArray<{ name: string }>) => items.map((item) => item.name);

function addBook(prisma: PrismaClient, refs: References, deletedAt: Date | null = null) {
  return prisma.book.create({
    data: {
      title: `Libro de ${refs.author}`,
      price: 1000,
      deletedAt,
      author: named(refs.author),
      publisher: named(refs.publisher),
      genre: named(refs.genre),
    },
  });
}

describe('PrismaCatalogRepository (PostgreSQL)', () => {
  let db: TestDatabase;
  let prisma: PrismaService;
  let repository: PrismaCatalogRepository;

  beforeAll(async () => {
    db = await startTestDatabase();
    process.env.DATABASE_URL = db.url;
    prisma = new PrismaService();
    repository = new PrismaCatalogRepository(prisma);
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
    await db.stop();
  });

  it('lists only authors, publishers and genres that still have an active book', async () => {
    await addBook(db.prisma, ACTIVE);
    await addBook(db.prisma, ORPHAN, new Date());
    await db.prisma.genre.create({ data: { name: 'Género sin libros' } });

    const catalog = await repository.load();

    expect([names(catalog.authors), names(catalog.publishers), names(catalog.genres)]).toEqual([
      [ACTIVE.author],
      [ACTIVE.publisher],
      [ACTIVE.genre],
    ]);
  });

  it('lists a value again, sorted by name, as soon as it has an active book', async () => {
    await addBook(db.prisma, { ...ACTIVE, genre: ORPHAN.genre });

    expect(names((await repository.load()).genres)).toEqual([ORPHAN.genre, ACTIVE.genre]);
  });
});
