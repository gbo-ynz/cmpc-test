import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { paginate } from '../../../shared/domain/pagination';
import {
  ADMIN,
  REGULAR_USER,
  createHttpApp,
  tokenFor,
  usersById,
} from '../../../test-utils/http-app';
import type { User } from '../../auth/domain/user';
import { AuditLogRepository } from '../domain/audit-log.repository';

const USER_ID = '0a1b2c3d-0000-4000-8000-0000000000bb';
const ENTRY = {
  id: '0a1b2c3d-0000-4000-8000-0000000000aa',
  action: 'LOGIN_FAILED',
  entityType: 'User',
  entityId: null,
  actor: null,
  metadata: { email: 'ghost@cmpc.cl', reason: 'UNKNOWN_EMAIL' },
  createdAt: new Date('2026-11-19T10:00:00Z'),
};

let app: NestExpressApplication;
let listPage: jest.Mock;

beforeEach(async () => {
  listPage = jest.fn().mockResolvedValue(paginate([ENTRY], 1, { page: 1, limit: 10 }));
  app = await createHttpApp(usersById(ADMIN, REGULAR_USER), {
    overrides: [{ provide: AuditLogRepository, useValue: { listPage } }],
  });
});

afterEach(() => app.close());

const get = async (user: User, query = '') =>
  request(app.getHttpServer())
    .get(`/api/audit-logs${query}`)
    .set('Authorization', `Bearer ${await tokenFor(app, user)}`);

it('requires a session', async () => {
  await request(app.getHttpServer()).get('/api/audit-logs').expect(401);
});

it('is closed to regular users: 403 and the trail is never read', async () => {
  const response = await get(REGULAR_USER);

  expect(response.status).toBe(403);
  expect(listPage).not.toHaveBeenCalled();
});

it('lists the trail for an administrator with pagination metadata', async () => {
  const { body } = await get(ADMIN);

  expect(body.data[0]).toMatchObject({ action: 'LOGIN_FAILED', actor: null });
  expect(body.meta).toMatchObject({ total: 1, page: 1 });
});

it('hands the filters and the page to the repository', async () => {
  const from = '2026-11-01T00:00:00.000Z';
  const query = `?action=LOGIN_FAILED&entityType=User&userId=${USER_ID}&from=${from}&page=2&limit=5`;

  await get(ADMIN, query);

  expect(listPage).toHaveBeenCalledWith(
    { page: 2, limit: 5 },
    { action: 'LOGIN_FAILED', entityType: 'User', userId: USER_ID, from: new Date(from) },
  );
});

it.each(['action=NOPE', 'userId=not-a-uuid', 'from=yesterday', 'limit=1000'])(
  'rejects an invalid filter (%s) with 400',
  async (query) => {
    expect((await get(ADMIN, `?${query}`)).status).toBe(400);
  },
);
