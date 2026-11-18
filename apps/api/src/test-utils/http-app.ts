import type { Type } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { configureApp } from '../bootstrap/app.setup';
import type { User, UserRepository } from '../modules/auth/domain/user';
import { UserRepository as UserRepositoryToken } from '../modules/auth/domain/user';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';

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

/**
 * The real AppModule with the real HTTP setup (global guards, helmet, pipes, filters).
 * Only persistence is replaced: no database is needed.
 */
export async function createHttpApp(
  users: UserRepository,
  controllers: Type[] = [],
): Promise<NestExpressApplication> {
  process.env.DATABASE_URL = 'postgresql://unused:unused@localhost:5432/unused';
  process.env.JWT_SECRET = 'x'.repeat(32);
  const prisma = {
    client: { $queryRaw: jest.fn().mockResolvedValue([1]) },
    onModuleInit: jest.fn(),
  };
  const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(UserRepositoryToken)
    .useValue(users)
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app);
  await app.init();
  return app;
}

/** A valid access token for the given user, signed with the app's own key. */
export function tokenFor(app: NestExpressApplication, user: User): Promise<string> {
  return app.get(JwtService).signAsync({ sub: user.id, email: user.email, role: user.role });
}
