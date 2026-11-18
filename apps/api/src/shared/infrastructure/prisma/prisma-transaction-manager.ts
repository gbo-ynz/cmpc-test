import { Injectable } from '@nestjs/common';
import { TransactionManager } from '../../application/transaction-manager.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaTransactionManager implements TransactionManager {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(work);
  }
}
