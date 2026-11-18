import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { addBook, names, type BookReferences } from '../../../../test-utils/db-fixtures';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { PrismaCatalogRepository } from './prisma-catalog.repository';

const ACTIVE: BookReferences = {
  author: 'Autor activo',
  publisher: 'Editorial activa',
  genre: 'Novela',
};
const ORPHAN: BookReferences = {
  author: 'Autor baja',
  publisher: 'Editorial baja',
  genre: 'Ensayo',
};

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
