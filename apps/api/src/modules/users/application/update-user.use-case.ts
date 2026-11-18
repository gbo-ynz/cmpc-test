import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import type { UserRole } from '../../../shared/domain/authenticated-user';
import { PasswordHasher } from '../../auth/application/ports/password-hasher.port';
import { normalizeEmail, normalizeUserName, type ManagedUser } from '../domain/managed-user';
import { ManagedUserRepository } from '../domain/managed-user.repository';
import {
  ensureAdministratorStays,
  ensureEmailAvailable,
  requireUser,
  userAudit,
} from './user-commands';

/** Partial update: omitted fields keep their value; the password only changes when sent. */
export interface UpdateUserCommand {
  readonly id: string;
  readonly name?: string;
  readonly email?: string;
  readonly role?: UserRole;
  readonly password?: string;
  readonly actorId: string;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly users: ManagedUserRepository,
    private readonly hasher: PasswordHasher,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  async execute(command: UpdateUserCommand): Promise<ManagedUser> {
    const passwordHash = command.password ? await this.hasher.hash(command.password) : undefined;
    return this.transactions.run(async () => {
      const current = await requireUser(this.users, command.id);
      const next = {
        name: command.name === undefined ? current.name : normalizeUserName(command.name),
        email: command.email === undefined ? current.email : normalizeEmail(command.email),
        role: command.role ?? current.role,
      };
      if (current.role === 'ADMIN' && next.role !== 'ADMIN') {
        await ensureAdministratorStays(this.users, current, command.actorId);
      }
      await ensureEmailAvailable(this.users, next.email, current.id);
      const updated = await this.users.update(current.id, { ...next, passwordHash });
      const previous = { name: current.name, email: current.email, role: current.role };
      const passwordChanged = passwordHash !== undefined;
      await this.audit.record(
        userAudit('UPDATE', updated, command.actorId, { previous, passwordChanged }),
      );
      return updated;
    });
  }
}
