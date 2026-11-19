import { startTestDatabase, type TestDatabase } from '../../../test-utils/postgres-container';

// The trail is evidence: the database itself refuses to rewrite it.
let db: TestDatabase;

beforeAll(async () => {
  db = await startTestDatabase();
});

afterAll(() => db.stop());

const addEntry = (userId?: string) =>
  db.prisma.$executeRawUnsafe(
    `INSERT INTO audit_logs (id, action, entity_type, user_id)
     VALUES (gen_random_uuid(), 'CREATE', 'Book', ${userId ? `'${userId}'` : 'NULL'})`,
  );

async function addUser(email: string): Promise<string> {
  const [{ id }] = await db.prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO users (id, email, name, password_hash, role, updated_at)
    VALUES (gen_random_uuid(), ${email}, 'Someone', 'x', 'USER', now())
    RETURNING id::text AS id`;
  return id;
}

const trail = () =>
  db.prisma.$queryRaw<Array<{ total: number; credited: number }>>`
    SELECT count(*)::int AS total, count(user_id)::int AS credited FROM audit_logs`;

const rejects = (sql: string) =>
  expect(db.prisma.$executeRawUnsafe(sql)).rejects.toThrow(/append-only/);

it('accepts new entries', async () => {
  await expect(addEntry()).resolves.toBe(1);
});

it('rejects editing an entry', async () => {
  await addEntry();

  await rejects(`UPDATE audit_logs SET action = 'DELETE'`);
});

it('rejects changing who is credited with an entry', async () => {
  const userId = await addUser('credit@cmpc.cl');
  await addEntry();

  await rejects(`UPDATE audit_logs SET user_id = '${userId}' WHERE user_id IS NULL`);
});

it('rejects deleting an entry', async () => {
  await addEntry();

  await rejects(`DELETE FROM audit_logs`);
});

it('still detaches the author when that user is deleted (ON DELETE SET NULL)', async () => {
  const userId = await addUser('gone@cmpc.cl');
  await addEntry(userId);
  const [before] = await trail();

  await db.prisma.$executeRawUnsafe(`DELETE FROM users WHERE id = '${userId}'`);

  expect(await trail()).toEqual([{ total: before.total, credited: 0 }]);
});
