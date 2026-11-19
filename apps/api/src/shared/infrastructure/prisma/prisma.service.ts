import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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
  private readonly commitHooks = new AsyncLocalStorage<Array<() => void>>();
  private readonly logger = new Logger(PrismaService.name);

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

  /**
   * Runs `hook` once the surrounding transaction has committed, or right away outside one, so
   * side effects such as logs never describe work that was rolled back.
   */
  onCommit(hook: () => void): void {
    const hooks = this.commitHooks.getStore();
    if (hooks) hooks.push(hook);
    else hook();
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.transactionStore.getStore()) return work();
    const hooks: Array<() => void> = [];
    const result = await this.client.$transaction((tx) =>
      this.transactionStore.run(tx, () => this.commitHooks.run(hooks, work)),
    );
    this.flush(hooks);
    return result;
  }

  /** The work is already committed: a failing hook is reported, never turned into a failure. */
  private flush(hooks: ReadonlyArray<() => void>): void {
    for (const hook of hooks) {
      try {
        hook();
      } catch (error) {
        this.logger.error('Post-commit hook failed', error instanceof Error ? error.stack : error);
      }
    }
  }
}
