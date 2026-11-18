import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { FakeAuditLogger, FakeTransactionManager } from '../../../test-utils/fakes';
import {
  ADMIN,
  REGULAR_USER,
  createHttpApp,
  tokenFor,
  usersById,
} from '../../../test-utils/http-app';
import { InMemoryReferenceRepository } from '../../../test-utils/in-memory-reference.repository';
import type { User } from '../../auth/domain/user';
import { ReferenceRepository } from '../domain/reference.repository';

let app: NestExpressApplication;
let references: InMemoryReferenceRepository;

beforeEach(async () => {
  references = new InMemoryReferenceRepository();
  app = await createHttpApp(usersById(ADMIN, REGULAR_USER), {
    overrides: [
      { provide: ReferenceRepository, useValue: references },
      { provide: TransactionManager, useValue: new FakeTransactionManager() },
      { provide: AuditLogger, useValue: new FakeAuditLogger() },
    ],
  });
});

afterEach(() => app.close());

/** Authenticated HTTP client for the given user. */
async function as(user: User) {
  const auth = { Authorization: `Bearer ${await tokenFor(app, user)}` };
  const server = app.getHttpServer();
  return {
    get: (path: string) => request(server).get(`/api${path}`).set(auth),
    post: (path: string, body: object) => request(server).post(`/api${path}`).set(auth).send(body),
    patch: (path: string, body: object) =>
      request(server).patch(`/api${path}`).set(auth).send(body),
    delete: (path: string) => request(server).delete(`/api${path}`).set(auth),
  };
}

it('lets every authenticated user list the three catalogs (the book form needs them)', async () => {
  references.seed('genres', 'Poesía', { active: 1, total: 1 });
  references.seed('genres', 'Ensayo');
  const user = await as(REGULAR_USER);

  const genres = await user.get('/genres');

  expect(genres.status).toBe(200);
  expect(genres.body.data).toEqual([
    expect.objectContaining({ name: 'Ensayo', activeBooks: 0 }),
    expect.objectContaining({ name: 'Poesía', activeBooks: 1 }),
  ]);
  expect((await user.get('/authors')).status).toBe(200);
  expect((await user.get('/publishers')).status).toBe(200);
});

it('answers 403 when a regular user tries to create, rename or delete', async () => {
  const author = references.seed('authors', 'Borges');
  const user = await as(REGULAR_USER);

  expect((await user.post('/authors', { name: 'Nuevo' })).status).toBe(403);
  expect((await user.patch(`/authors/${author.id}`, { name: 'Otro' })).status).toBe(403);
  expect((await user.delete(`/authors/${author.id}`)).status).toBe(403);
});

it('lets an administrator create (201) and answers 409 to a name repeated ignoring case', async () => {
  const admin = await as(ADMIN);

  const created = await admin.post('/publishers', { name: '  Sur ' });
  const repeated = await admin.post('/publishers', { name: 'sur' });

  expect(created.status).toBe(201);
  expect(created.body.data).toMatchObject({ name: 'Sur' });
  expect(repeated.status).toBe(409);
  expect(repeated.body.error.code).toBe('CONFLICT');
});

it('answers 400 to invalid bodies', async () => {
  const admin = await as(ADMIN);

  expect((await admin.post('/genres', { name: '' })).status).toBe(400);
  expect((await admin.post('/genres', { name: '   ' })).status).toBe(400);
  expect((await admin.post('/genres', { name: 'x'.repeat(81) })).status).toBe(400);
  expect((await admin.post('/genres', { name: 'Ok', extra: true })).status).toBe(400);
});

it('renames and deletes, but refuses to delete a record that has books', async () => {
  const used = references.seed('authors', 'Con libros', { active: 0, total: 2 });
  const free = references.seed('authors', 'Sin libros');
  const admin = await as(ADMIN);

  const renamed = await admin.patch(`/authors/${free.id}`, { name: 'Renombrado' });

  expect(renamed.status).toBe(200);
  expect(renamed.body.data.name).toBe('Renombrado');
  expect((await admin.delete(`/authors/${used.id}`)).status).toBe(409);
  expect((await admin.delete(`/authors/${free.id}`)).status).toBe(204);
});

it('answers 404 to an unknown id and 400 to a malformed one', async () => {
  const admin = await as(ADMIN);

  expect((await admin.delete('/genres/00000000-0000-4000-8000-000000000000')).status).toBe(404);
  expect((await admin.delete('/genres/not-a-uuid')).status).toBe(400);
});
