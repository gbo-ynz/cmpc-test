import type { PrismaClient } from '@prisma/client';

export const AUDIT_ACTOR_NAME = 'Ana Admin';

type SeededAction = 'CREATE' | 'UPDATE' | 'LOGIN' | 'LOGIN_FAILED';

/** Four entries, one per day from 2026-03-01: three by Ana and a failed sign-in with no actor. */
export async function seedAuditTrail(prisma: PrismaClient): Promise<{ userId: string }> {
  const { id: userId } = await prisma.user.create({
    data: { email: 'ana@cmpc.cl', name: AUDIT_ACTOR_NAME, passwordHash: 'x', role: 'ADMIN' },
  });
  const entry = (day: number, action: SeededAction) => ({
    action,
    entityType: action.startsWith('LOGIN') ? 'User' : 'Book',
    entityId: action === 'CREATE' || action === 'UPDATE' ? 'b-1' : null,
    userId: action === 'LOGIN_FAILED' ? null : userId,
    metadata: { day },
    createdAt: new Date(`2026-03-0${day}T10:00:00Z`),
  });
  const entries = [
    entry(1, 'CREATE'),
    entry(2, 'UPDATE'),
    entry(3, 'LOGIN_FAILED'),
    entry(4, 'LOGIN'),
  ];
  for (const data of entries) await prisma.auditLog.create({ data });
  return { userId };
}
