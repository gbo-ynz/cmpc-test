import type { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports ok when the database answers', async () => {
    const prisma = { client: { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.check()).resolves.toEqual({ status: 'ok', database: 'up' });
  });

  it('propagates database failures so the probe fails', async () => {
    const prisma = { client: { $queryRaw: jest.fn().mockRejectedValue(new Error('down')) } };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.check()).rejects.toThrow('down');
  });
});
