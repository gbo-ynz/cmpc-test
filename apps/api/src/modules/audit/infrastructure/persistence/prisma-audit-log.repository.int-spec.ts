import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AUDIT_ACTOR_NAME, seedAuditTrail } from '../../../../test-utils/audit-fixtures';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { PrismaAuditLogRepository } from './prisma-audit-log.repository';

// The tests share one seeded database (see seedAuditTrail).
let db: TestDatabase;
let prisma: PrismaService;
let repository: PrismaAuditLogRepository;
let userId: string;

beforeAll(async () => {
  db = await startTestDatabase();
  process.env.DATABASE_URL = db.url;
  prisma = new PrismaService();
  repository = new PrismaAuditLogRepository(prisma);
  ({ userId } = await seedAuditTrail(db.prisma));
});

afterAll(async () => {
  await prisma.onModuleDestroy();
  await db.stop();
});

const ALL = { page: 1, limit: 10 };
const actions = async (filter = {}) =>
  (await repository.listPage(ALL, filter)).items.map((entry) => entry.action);

it('lists newest first and names the actor', async () => {
  const { items, meta } = await repository.listPage(ALL, {});

  expect(items.map((entry) => entry.action)).toEqual(['LOGIN', 'LOGIN_FAILED', 'UPDATE', 'CREATE']);
  expect(items[0]?.actor).toEqual({ id: userId, name: AUDIT_ACTOR_NAME });
  expect(meta).toMatchObject({ total: 4, page: 1, totalPages: 1 });
});

it('keeps entries that have no actor', async () => {
  const { items } = await repository.listPage(ALL, { action: 'LOGIN_FAILED' });

  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ actor: null, metadata: { day: 3 } });
});

it('filters by entity, by actor and by date range', async () => {
  expect(await actions({ entityType: 'Book', entityId: 'b-1' })).toEqual(['UPDATE', 'CREATE']);
  expect(await actions({ userId })).toEqual(['LOGIN', 'UPDATE', 'CREATE']);
  const range = { from: new Date('2026-03-02T00:00:00Z'), to: new Date('2026-03-03T23:59:59Z') };
  expect(await actions(range)).toEqual(['LOGIN_FAILED', 'UPDATE']);
});

it('paginates on the server and reports the total', async () => {
  const page = await repository.listPage({ page: 2, limit: 2 }, {});

  expect(page.items.map((entry) => entry.action)).toEqual(['UPDATE', 'CREATE']);
  expect(page.meta).toMatchObject({ total: 4, page: 2, limit: 2, totalPages: 2 });
});
