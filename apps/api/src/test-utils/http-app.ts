import type { Abstract, Type } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { configureApp } from '../bootstrap/app.setup';
import type { User, UserRepository } from '../modules/auth/domain/user';
import { UserRepository as UserRepositoryToken } from '../modules/auth/domain/user';
import { AuditLogger } from '../shared/application/audit-logger.port';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { FakeAuditLogger } from './fakes';

export const ADMIN: User = {
  id: 'admin-1',
  email: 'admin@cmpc.cl',
  name: 'Admin',
  role: 'ADMIN',
  passwordHash: 'unused',
};

export const REGULAR_USER: User = {
  ...ADMIN,
  id: 'user-1',
  email: 'usuario@cmpc.cl',
  role: 'USER',
};

export interface HttpAppOptions {
  /** Extra controllers mounted on top of AppModule (e.g. a probe route). */
  readonly controllers?: Type[];
  /** Providers replaced by in-memory fakes. */
  readonly overrides?: ReadonlyArray<{ provide: Type | Abstract<unknown>; useValue: unknown }>;
}

/**
 * The real AppModule with the real HTTP setup (global guards, helmet, pipes, filters).
 * Only persistence is replaced: no database is needed.
 */
export async function createHttpApp(
  users: UserRepository,
  { controllers = [], overrides = [] }: HttpAppOptions = {},
): Promise<NestExpressApplication> {
  process.env.DATABASE_URL = 'postgresql://unused:unused@localhost:5432/unused';
  process.env.JWT_SECRET = 'x'.repeat(32);
  const prisma = {
    client: { $queryRaw: jest.fn().mockResolvedValue([1]) },
    onModuleInit: jest.fn(),
  };
  let builder = Test.createTestingModule({ imports: [AppModule], controllers })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(UserRepositoryToken)
    .useValue(users)
    // A failed login is audited too, so even specs that never touch the database need one.
    .overrideProvider(AuditLogger)
    .useValue(new FakeAuditLogger());
  for (const { provide, useValue } of overrides) {
    builder = builder.overrideProvider(provide).useValue(useValue);
  }
  const app = (await builder.compile()).createNestApplication<NestExpressApplication>({
    logger: false,
  });
  configureApp(app);
  await app.init();
  return app;
}

/** A valid access token for the given user, signed with the app's own key. */
export function tokenFor(app: NestExpressApplication, user: User): Promise<string> {
  return app.get(JwtService).signAsync({ sub: user.id, email: user.email, role: user.role });
}

/** Users repository fake that resolves the given users by id (for signed tokens). */
export function usersById(...known: User[]): UserRepository {
  const byId = new Map(known.map((user) => [user.id, user]));
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    findById: jest.fn((id: string) => Promise.resolve(byId.get(id) ?? null)),
  };
}
