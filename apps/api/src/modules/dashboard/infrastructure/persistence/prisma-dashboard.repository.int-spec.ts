import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { seedDashboardData } from '../../../../test-utils/dashboard-fixtures';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { PrismaDashboardRepository } from './prisma-dashboard.repository';

// The tests share one seeded database.
let db: TestDatabase;
let prisma: PrismaService;
let repository: PrismaDashboardRepository;

beforeAll(async () => {
  db = await startTestDatabase();
  process.env.DATABASE_URL = db.url;
  prisma = new PrismaService();
  repository = new PrismaDashboardRepository(prisma);
  await seedDashboardData(db.prisma);
});

afterAll(async () => {
  await prisma.onModuleDestroy();
  await db.stop();
});

it('counts active books and how many have stock, ignoring deleted ones', async () => {
  expect(await repository.bookStats()).toEqual({ active: 3, available: 2, unavailable: 1 });
});

it('counts active books per genre, most first, with empty genres at the end', async () => {
  expect(await repository.booksByGenre()).toEqual([
    { genre: 'Novela', books: 2 },
    { genre: 'Ensayo', books: 1 },
    { genre: 'Vacío', books: 0 },
  ]);
});

it('values only the available, active inventory: price x stock, with decimals', async () => {
  expect(await repository.inventoryValue()).toBe(4001); // 1000.50 x 2 + 2000 x 1
});

it('counts pending sales and adds up only the completed ones', async () => {
  expect(await repository.salesStats()).toEqual({
    pending: 2,
    completed: 2,
    completedAmount: 3500.5,
  });
});

it('counts the catalogs and only the active users', async () => {
  expect(await repository.catalogStats()).toEqual({
    authors: 1,
    publishers: 1,
    genres: 3,
    users: 2,
  });
});

it('returns the newest audit entries first, with the author and a label when known', async () => {
  const activity = await repository.recentActivity(10);

  expect(activity).toHaveLength(10);
  expect(activity[0]).toMatchObject({ label: 'Libro 11', actorName: null });
  expect(activity[2]).toMatchObject({ label: 'Libro 9', actorName: 'Beto', entityType: 'Book' });
  expect(activity[9].label).toBe('Libro 2');
});
