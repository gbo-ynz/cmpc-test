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

  describe('post-commit hooks', () => {
    /** A $transaction stand-in that records the moment the transaction commits. */
    function transactionLog(service: PrismaService, fails = false) {
      const order: string[] = [];
      jest.spyOn(service.client, '$transaction').mockImplementation(((
        work: (client: unknown) => Promise<unknown>,
      ) =>
        work({}).then((result) => {
          if (fails) throw new Error('rolled back');
          order.push('commit');
          return result;
        })) as never);
      return order;
    }

    it('runs a hook after the transaction commits, not before', async () => {
      const service = new PrismaService();
      const order = transactionLog(service);

      await service.runInTransaction(async () => {
        service.onCommit(() => order.push('hook'));
        order.push('work');
      });

      expect(order).toEqual(['work', 'commit', 'hook']);
    });

    it('drops the hooks when the transaction fails', async () => {
      const service = new PrismaService();
      const hook = jest.fn();
      transactionLog(service, true);

      await expect(service.runInTransaction(async () => service.onCommit(hook))).rejects.toThrow(
        'rolled back',
      );

      expect(hook).not.toHaveBeenCalled();
    });

    it('runs the hook right away when there is no transaction', () => {
      const hook = jest.fn();

      new PrismaService().onCommit(hook);

      expect(hook).toHaveBeenCalledTimes(1);
    });

    it('does not fail an already committed operation when a hook throws', async () => {
      const service = new PrismaService();
      transactionLog(service);

      const result = service.runInTransaction(async () => {
        service.onCommit(() => {
          throw new Error('hook failed');
        });
        return 'committed';
      });

      await expect(result).resolves.toBe('committed');
    });
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
