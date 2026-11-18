import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import type { UserRole } from '../../../shared/domain/authenticated-user';
import { PasswordHasher } from '../../auth/application/ports/password-hasher.port';
import { normalizeEmail, normalizeUserName, type ManagedUser } from '../domain/managed-user';
import { ManagedUserRepository } from '../domain/managed-user.repository';
import { ensureEmailAvailable, userAudit } from './user-commands';

export interface CreateUserCommand {
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly password: string;
  readonly actorId: string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly users: ManagedUserRepository,
    private readonly hasher: PasswordHasher,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  async execute({ password, role, actorId, ...input }: CreateUserCommand): Promise<ManagedUser> {
    const name = normalizeUserName(input.name);
    const email = normalizeEmail(input.email);
    // Hashing is slow on purpose: do it before opening the transaction.
    const passwordHash = await this.hasher.hash(password);
    return this.transactions.run(async () => {
      await ensureEmailAvailable(this.users, email);
      const created = await this.users.create({ name, email, role, passwordHash });
      await this.audit.record(userAudit('CREATE', created, actorId));
      return created;
    });
  }
}
