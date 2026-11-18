import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import {
  FakeAuditLogger,
  FakePasswordHasher,
  FakeTransactionManager,
} from '../../../test-utils/fakes';
import {
  ADMIN,
  REGULAR_USER,
  createHttpApp,
  tokenFor,
  usersById,
} from '../../../test-utils/http-app';
import { InMemoryManagedUserRepository } from '../../../test-utils/in-memory-managed-user.repository';
import { PasswordHasher } from '../../auth/application/ports/password-hasher.port';
import type { User } from '../../auth/domain/user';
import { ManagedUserRepository } from '../domain/managed-user.repository';

// Ids reach the HTTP layer as UUIDs: the shared ADMIN fixture uses a short id.
const ROOT: User = { ...ADMIN, id: '0a1b2c3d-0000-4000-8000-0000000000aa' };

let app: NestExpressApplication;
let users: InMemoryManagedUserRepository;

beforeEach(async () => {
  users = new InMemoryManagedUserRepository();
  users.seed({ id: ROOT.id, email: ROOT.email, name: 'Admin', role: 'ADMIN' });
  app = await createHttpApp(usersById(ROOT, REGULAR_USER), {
    overrides: [
      { provide: ManagedUserRepository, useValue: users },
      { provide: PasswordHasher, useValue: new FakePasswordHasher() },
      { provide: TransactionManager, useValue: new FakeTransactionManager() },
      { provide: AuditLogger, useValue: new FakeAuditLogger() },
    ],
  });
});

afterEach(() => app.close());

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

const NEW_USER = { name: 'Ana Pérez', email: 'ana@cmpc.cl', role: 'USER', password: 'secret123' };

describe('permissions', () => {
  it('rejects anonymous requests and regular users', async () => {
    await request(app.getHttpServer()).get('/api/users').expect(401);

    const user = await as(REGULAR_USER);
    await user.get('/users').expect(403);
    await user.post('/users', NEW_USER).expect(403);
    await user.patch(`/users/${ROOT.id}`, { name: 'X' }).expect(403);
    await user.delete(`/users/${ROOT.id}`).expect(403);
  });
});

describe('POST /users', () => {
  it('creates the user and never answers with the password', async () => {
    const admin = await as(ROOT);

    const response = await admin.post('/users', NEW_USER).expect(201);

    expect(response.body.data).toMatchObject({
      name: 'Ana Pérez',
      email: 'ana@cmpc.cl',
      role: 'USER',
    });
    expect(JSON.stringify(response.body)).not.toMatch(/password|secret123|hash/i);
  });

  it('validates the email, the profile and the password length', async () => {
    const admin = await as(ROOT);

    await admin.post('/users', { ...NEW_USER, email: 'not-an-email' }).expect(400);
    await admin.post('/users', { ...NEW_USER, role: 'NOBODY' }).expect(400);
    await admin.post('/users', { ...NEW_USER, password: 'short' }).expect(400);
    await admin.post('/users', { ...NEW_USER, name: '' }).expect(400);
  });

  it('answers 409 when the email is already registered', async () => {
    const admin = await as(ROOT);
    await admin.post('/users', NEW_USER).expect(201);

    await admin.post('/users', { ...NEW_USER, email: 'ANA@cmpc.cl' }).expect(409);
  });
});

describe('GET /users', () => {
  it('paginates on the server and hides the password', async () => {
    const admin = await as(ROOT);
    await admin.post('/users', NEW_USER).expect(201);

    const response = await admin.get('/users?page=1&limit=1').expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toEqual({ total: 2, page: 1, limit: 1, totalPages: 2 });
    expect(JSON.stringify(response.body)).not.toMatch(/password|hash/i);
  });

  it('answers 404 for an unknown id and 400 for a malformed one', async () => {
    const admin = await as(ROOT);

    await admin.get('/users/0a1b2c3d-0000-4000-8000-0000000000ff').expect(404);
    await admin.get('/users/nope').expect(400);
  });
});

describe('PATCH and DELETE /users/:id', () => {
  it('updates a user without touching the password', async () => {
    const admin = await as(ROOT);
    const { body } = await admin.post('/users', NEW_USER).expect(201);

    await admin.patch(`/users/${body.data.id}`, { name: 'Ana María' }).expect(200);

    expect(users.storedPasswordHash(body.data.id)).toBe('hash:secret123');
  });

  it('deactivates a user, who then disappears from the list', async () => {
    const admin = await as(ROOT);
    const { body } = await admin.post('/users', NEW_USER).expect(201);

    await admin.delete(`/users/${body.data.id}`).expect(204);

    await admin.get(`/users/${body.data.id}`).expect(404);
    expect((await admin.get('/users')).body.meta.total).toBe(1);
  });

  it('answers 409 when an administrator deletes or demotes themselves', async () => {
    const admin = await as(ROOT);

    await admin.delete(`/users/${ROOT.id}`).expect(409);
    await admin.patch(`/users/${ROOT.id}`, { role: 'USER' }).expect(409);
  });
});
