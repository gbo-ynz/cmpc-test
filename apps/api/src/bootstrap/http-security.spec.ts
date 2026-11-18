import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { JwtService } from '@nestjs/jwt';
import { User, UserRepository } from '../modules/auth/domain/user';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { configureApp } from './app.setup';

// Real AppModule + real HTTP setup (guards, helmet, pipes); only persistence is replaced.
const LOGIN_LIMIT = 5;
const GLOBAL_LIMIT = 120;
const WRONG_CREDENTIALS = { email: 'admin@cmpc.cl', password: 'WrongPassword1!' };
const USER: User = {
  id: 'user-1',
  email: 'admin@cmpc.cl',
  name: 'Admin',
  role: 'ADMIN',
  passwordHash: 'unused',
};

async function createApp(): Promise<NestExpressApplication> {
  process.env.DATABASE_URL = 'postgresql://unused:unused@localhost:5432/unused';
  process.env.JWT_SECRET = 'x'.repeat(32);
  const prisma = {
    client: { $queryRaw: jest.fn().mockResolvedValue([1]) },
    onModuleInit: jest.fn(),
  };
  // Unknown email (login always fails) but a resolvable id (signed tokens are accepted).
  const users: UserRepository = {
    findByEmail: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(USER),
  };
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(UserRepository)
    .useValue(users)
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app);
  await app.init();
  return app;
}

describe('HTTP security (rate limiting and headers)', () => {
  let app: NestExpressApplication;

  // A fresh app per test: the throttler keeps its counters in memory.
  beforeEach(async () => {
    app = await createApp();
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
    const token = await app
      .get(JwtService)
      .signAsync({ sub: USER.id, email: USER.email, role: USER.role });
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
