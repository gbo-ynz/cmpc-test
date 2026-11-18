import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { PrismaManagedUserRepository } from './prisma-managed-user.repository';

const base = { passwordHash: 'h', role: 'USER' as const };

// The tests run in order and share the database.
let db: TestDatabase;
let prisma: PrismaService;
let repository: PrismaManagedUserRepository;

beforeAll(async () => {
  db = await startTestDatabase();
  process.env.DATABASE_URL = db.url;
  prisma = new PrismaService();
  repository = new PrismaManagedUserRepository(prisma);
  await db.prisma.user.createMany({
    data: [
      { ...base, name: 'Beto', email: 'beto@cmpc.cl' },
      { ...base, name: 'Ana', email: 'ana@cmpc.cl', role: 'ADMIN' },
      { ...base, name: 'Carla', email: 'carla@cmpc.cl' },
      { ...base, name: 'Baja', email: 'baja@cmpc.cl', deletedAt: new Date() },
    ],
  });
});

afterAll(async () => {
  await prisma.onModuleDestroy();
  await db.stop();
});

it('pages active users sorted by name, without the password hash', async () => {
  const page = await repository.listPage({ page: 2, limit: 2 });

  expect(page.items.map((user) => user.name)).toEqual(['Carla']);
  expect(page.meta).toEqual({ total: 3, page: 2, limit: 2, totalPages: 2 });
  expect(page.items[0]).not.toHaveProperty('passwordHash');
});

it('finds emails ignoring case, deactivated users included, but hides them by id', async () => {
  const baja = await repository.findByEmail('baja@cmpc.cl');

  expect(await repository.findByEmail('ANA@cmpc.cl')).toMatchObject({ name: 'Ana' });
  expect(baja).toMatchObject({ name: 'Baja' });
  expect(await repository.findById(baja!.id)).toBeNull();
  expect(await repository.findByEmail('nadie@cmpc.cl')).toBeNull();
});

it('creates and updates keeping the password unless a new hash is sent', async () => {
  const created = await repository.create({ ...base, name: 'Dora', email: 'dora@cmpc.cl' });

  await repository.update(created.id, { name: 'Dora M.', email: 'dora@cmpc.cl', role: 'ADMIN' });
  const kept = await db.prisma.user.findUniqueOrThrow({ where: { id: created.id } });
  await repository.update(created.id, {
    name: 'Dora M.',
    email: 'dora@cmpc.cl',
    role: 'ADMIN',
    passwordHash: 'new-hash',
  });
  const changed = await db.prisma.user.findUniqueOrThrow({ where: { id: created.id } });

  expect(kept).toMatchObject({ name: 'Dora M.', role: 'ADMIN', passwordHash: 'h' });
  expect(changed.passwordHash).toBe('new-hash');
});

it('deactivates logically and counts only active administrators', async () => {
  const dora = await repository.findByEmail('dora@cmpc.cl');
  expect(await repository.countActiveAdmins()).toBe(2);

  await repository.deactivate(dora!.id);

  expect(await repository.countActiveAdmins()).toBe(1);
  expect(await repository.findById(dora!.id)).toBeNull();
  expect(await db.prisma.user.count({ where: { id: dora!.id } })).toBe(1);
});
