import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { FakeDashboardRepository } from '../../../test-utils/fake-dashboard.repository';
import {
  ADMIN,
  REGULAR_USER,
  createHttpApp,
  tokenFor,
  usersById,
} from '../../../test-utils/http-app';
import type { User } from '../../auth/domain/user';
import { DashboardRepository } from '../domain/dashboard.repository';

let app: NestExpressApplication;

beforeEach(async () => {
  app = await createHttpApp(usersById(ADMIN, REGULAR_USER), {
    overrides: [{ provide: DashboardRepository, useValue: new FakeDashboardRepository() }],
  });
});

afterEach(() => app.close());

const get = async (user: User) =>
  request(app.getHttpServer())
    .get('/api/dashboard')
    .set({ Authorization: `Bearer ${await tokenFor(app, user)}` });

describe('GET /dashboard', () => {
  it('requires a session', async () => {
    await request(app.getHttpServer()).get('/api/dashboard').expect(401);
  });

  it('answers 200 to a regular user without any administration data in the response', async () => {
    const { body } = await get(REGULAR_USER).then((response) => {
      expect(response.status).toBe(200);
      return response;
    });

    expect(body.data.books).toEqual({ active: 5, available: 3, unavailable: 2 });
    expect(body.data.sales.completedAmount).toBe(123500);
    expect(JSON.stringify(body)).not.toMatch(/administration|inventoryValue|recentActivity|users/);
  });

  it('answers an administrator with the administration section as well', async () => {
    const { body } = await get(ADMIN);

    expect(body.data.administration).toMatchObject({
      inventoryValue: 987650.5,
      catalog: { authors: 8, publishers: 6, genres: 4, users: 3 },
    });
    expect(body.data.administration.recentActivity[0]).toMatchObject({
      action: 'CREATE',
      entityType: 'Book',
      label: 'Rayuela',
      actorName: 'Admin',
    });
  });
});
