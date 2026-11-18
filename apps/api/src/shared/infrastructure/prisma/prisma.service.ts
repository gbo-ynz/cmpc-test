import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Composition, not inheritance: PrismaClient's constructor returns a Proxy that
 * owns the model delegates (`user`, `book`...). A getter on a subclass runs with
 * `this` bound to the raw target, where those delegates do not exist.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client = new PrismaClient();
  private readonly transactionStore = new AsyncLocalStorage<Prisma.TransactionClient>();

  /** Transaction-aware client: repositories must always query through `db`. */
  get db(): Prisma.TransactionClient {
    return this.transactionStore.getStore() ?? this.client;
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.transactionStore.getStore()) return work();
    return this.client.$transaction((tx) => this.transactionStore.run(tx, work));
  }
}
