import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { UserRepository } from '../modules/auth/domain/user';
import { ADMIN, createHttpApp, tokenFor } from '../test-utils/http-app';

const LOGIN_LIMIT = 5;
const GLOBAL_LIMIT = 120;
const WRONG_CREDENTIALS = { email: 'admin@cmpc.cl', password: 'WrongPassword1!' };

// Unknown email (login always fails) but a resolvable id (signed tokens are accepted).
const users = (): UserRepository => ({
  findByEmail: jest.fn().mockResolvedValue(null),
  findById: jest.fn().mockResolvedValue(ADMIN),
});

describe('HTTP security (rate limiting and headers)', () => {
  let app: NestExpressApplication;

  // A fresh app per test: the throttler keeps its counters in memory.
  beforeEach(async () => {
    app = await createHttpApp(users());
  });

  afterEach(() => app.close());

  const login = () => request(app.getHttpServer()).post('/api/auth/login').send(WRONG_CREDENTIALS);

  it(`allows ${LOGIN_LIMIT} login attempts per minute and rejects the next one with 429`, async () => {
    for (let attempt = 1; attempt <= LOGIN_LIMIT; attempt += 1) {
      expect((await login()).status).toBe(401);
    }

    const blocked = await login();

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, error: { code: 'TOO_MANY_REQUESTS' } });
  });

  it(`limits authenticated routes to ${GLOBAL_LIMIT} requests per minute`, async () => {
    const token = await tokenFor(app, ADMIN);
    const me = () =>
      request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    for (let call = 1; call <= GLOBAL_LIMIT; call += 1) {
      expect((await me()).status).toBe(200);
    }

    expect((await me()).status).toBe(429);
  });

  it('never throttles the health probe (Docker polls it continuously)', async () => {
    const server = app.getHttpServer();
    for (let call = 1; call <= GLOBAL_LIMIT + 1; call += 1) {
      expect((await request(server).get('/api/health')).status).toBe(200);
    }
  });

  it('sends security headers and hides the framework', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');

    expect(response.headers).toMatchObject({
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'strict-transport-security': expect.stringContaining('max-age='),
      'content-security-policy': expect.stringContaining("default-src 'self'"),
    });
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
