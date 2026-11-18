import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { PrismaUserRepository } from './prisma-user.repository';

const active = {
  email: 'activo@cmpc.cl',
  name: 'Activo',
  passwordHash: 'h',
  role: 'USER' as const,
};
const deleted = { ...active, email: 'baja@cmpc.cl', name: 'Dado de baja' };

describe('PrismaUserRepository (PostgreSQL)', () => {
  let db: TestDatabase;
  let prisma: PrismaService;
  let repository: PrismaUserRepository;
  let activeId: string;
  let deletedId: string;

  beforeAll(async () => {
    db = await startTestDatabase();
    process.env.DATABASE_URL = db.url;
    prisma = new PrismaService();
    repository = new PrismaUserRepository(prisma);
    activeId = (await db.prisma.user.create({ data: active })).id;
    deletedId = (await db.prisma.user.create({ data: { ...deleted, deletedAt: new Date() } })).id;
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
    await db.stop();
  });

  it('finds active users by email and by id', async () => {
    expect(await repository.findByEmail(active.email)).toMatchObject({
      id: activeId,
      role: 'USER',
    });
    expect(await repository.findById(activeId)).toMatchObject({ email: active.email });
  });

  it('ignores deleted users: they cannot log in and their tokens stop working', async () => {
    expect(await repository.findByEmail(deleted.email)).toBeNull();
    expect(await repository.findById(deletedId)).toBeNull();
  });
});
