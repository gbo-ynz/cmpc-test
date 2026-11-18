import type { Prisma } from '@prisma/client';
import { PrismaTransactionManager } from './prisma-transaction-manager';
import { PrismaService } from './prisma.service';

// No database needed: model delegates exist before $connect().
describe('PrismaService', () => {
  it('exposes model delegates through `db` outside transactions (regression)', () => {
    const service = new PrismaService();

    expect(service.db.user).toBeDefined();
    expect(service.db.book).toBeDefined();
  });

  it('routes `db` to the transaction client inside runInTransaction', async () => {
    const service = new PrismaService();
    const tx = { marker: 'tx' } as unknown as Prisma.TransactionClient;
    jest
      .spyOn(service.client, '$transaction')
      .mockImplementation(((work: (client: Prisma.TransactionClient) => unknown) =>
        work(tx)) as never);

    const seen = await service.runInTransaction(async () => service.db);

    expect(seen).toBe(tx);
    expect(service.db).toBe(service.client);
  });

  it('joins the outer transaction instead of nesting', async () => {
    const service = new PrismaService();
    const transaction = jest
      .spyOn(service.client, '$transaction')
      .mockImplementation(((work: (client: unknown) => unknown) => work({})) as never);

    await new PrismaTransactionManager(service).run(() =>
      service.runInTransaction(async () => 'inner'),
    );

    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('connects and disconnects with the Nest lifecycle', async () => {
    const service = new PrismaService();
    const connect = jest.spyOn(service.client, '$connect').mockResolvedValue();
    const disconnect = jest.spyOn(service.client, '$disconnect').mockResolvedValue();

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(connect).toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
  });
});
