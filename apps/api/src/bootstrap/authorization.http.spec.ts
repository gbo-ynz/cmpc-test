import { Controller, Get } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { User, UserRepository } from '../modules/auth/domain/user';
import { Roles } from '../modules/auth/index';
import { ADMIN, REGULAR_USER, createHttpApp, tokenFor } from '../test-utils/http-app';

@Controller('probe')
class ProbeController {
  @Roles('ADMIN')
  @Get('admin')
  adminOnly() {
    return { ok: true };
  }

  @Get('any')
  anyRole() {
    return { ok: true };
  }
}

describe('authorization by role (real guards over HTTP)', () => {
  let app: NestExpressApplication;
  let stored: Record<string, User>;

  beforeEach(async () => {
    stored = { [ADMIN.id]: ADMIN, [REGULAR_USER.id]: REGULAR_USER };
    const users: UserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn((id: string) => Promise.resolve(stored[id] ?? null)),
    };
    app = await createHttpApp(users, { controllers: [ProbeController] });
  });

  afterEach(() => app.close());

  const get = async (path: string, user?: User) => {
    const call = request(app.getHttpServer()).get(`/api/probe/${path}`);
    return user ? call.set('Authorization', `Bearer ${await tokenFor(app, user)}`) : call;
  };

  it('lets an administrator into admin routes', async () => {
    expect((await get('admin', ADMIN)).status).toBe(200);
  });

  it('answers 403 FORBIDDEN to a regular user on admin routes', async () => {
    const response = await get('admin', REGULAR_USER);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ success: false, error: { code: 'FORBIDDEN' } });
  });

  it('keeps routes without @Roles open to every authenticated user', async () => {
    expect((await get('any', REGULAR_USER)).status).toBe(200);
  });

  it('authenticates before authorizing: no token is 401, not 403', async () => {
    expect((await get('admin')).status).toBe(401);
  });

  it('reads the role from the database, not from the token', async () => {
    const token = await tokenFor(app, ADMIN);
    stored[ADMIN.id] = { ...ADMIN, role: 'USER' }; // demoted after the token was issued

    const response = await request(app.getHttpServer())
      .get('/api/probe/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
