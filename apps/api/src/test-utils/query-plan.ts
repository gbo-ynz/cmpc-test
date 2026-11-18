import type { PrismaClient } from '@prisma/client';

/** EXPLAIN output for a query, with sequential scans discouraged so index choice is visible. */
export const planOf = (prisma: PrismaClient, sql: string): Promise<string> =>
  prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL enable_seqscan = off');
    const rows = await tx.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(`EXPLAIN ${sql}`);
    return rows.map((row) => row['QUERY PLAN']).join('\n');
  });
