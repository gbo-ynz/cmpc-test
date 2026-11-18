import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

/** apps/api: where prisma/schema.prisma, the migrations and the seed live. */
export const API_ROOT = resolve(__dirname, '../..');

export interface TestDatabase {
  readonly url: string;
  readonly prisma: PrismaClient;
  stop(): Promise<void>;
}

/** Runs a Node/Prisma CLI command against the given database. */
export function runAgainst(url: string, command: string, args: readonly string[]): void {
  execFileSync(command, args, {
    cwd: API_ROOT,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
}

/**
 * Ephemeral PostgreSQL 16 (same image as docker-compose) with the real migrations applied,
 * so integration tests run against exactly the production schema.
 */
export async function startTestDatabase({ migrate = true } = {}): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const url = container.getConnectionUri();
  if (migrate) runAgainst(url, 'npx', ['prisma', 'migrate', 'deploy']);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  return {
    url,
    prisma,
    stop: async () => {
      await prisma.$disconnect();
      await container.stop();
    },
  };
}
