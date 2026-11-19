import { Logger } from '@nestjs/common';
import type { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { PrismaAuditLogger } from './prisma-audit-logger';

function setup() {
  const create = jest.fn().mockResolvedValue(undefined);
  const hooks: Array<() => void> = [];
  const prisma = {
    db: { auditLog: { create } },
    onCommit: (hook: () => void) => hooks.push(hook),
  } as unknown as PrismaService;
  const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  return { logger: new PrismaAuditLogger(prisma), create, hooks, log };
}

afterEach(() => jest.restoreAllMocks());

describe('PrismaAuditLogger', () => {
  it('persists the entry through the transaction-aware client', async () => {
    const { logger, create } = setup();

    await logger.record({ action: 'CREATE', entityType: 'Book', entityId: 'b-1', actorId: 'u-1' });

    expect(create).toHaveBeenCalledWith({
      data: {
        action: 'CREATE',
        entityType: 'Book',
        entityId: 'b-1',
        userId: 'u-1',
        metadata: undefined,
      },
    });
  });

  it('mirrors the entry to stdout only once the transaction has committed', async () => {
    const { logger, hooks, log } = setup();
    const entry = { action: 'DELETE', entityType: 'Book', entityId: 'b-1' } as const;

    await logger.record(entry);

    expect(log).not.toHaveBeenCalled();
    hooks.forEach((hook) => hook());
    expect(log).toHaveBeenCalledWith(JSON.stringify(entry));
  });
});
