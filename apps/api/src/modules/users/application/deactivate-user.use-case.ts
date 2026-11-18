import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { ManagedUserRepository } from '../domain/managed-user.repository';
import { ensureAdministratorStays, requireUser, userAudit } from './user-commands';

/** "Delete" is a logical deactivation: the audit trail keeps pointing to the user. */
@Injectable()
export class DeactivateUserUseCase {
  constructor(
    private readonly users: ManagedUserRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  execute(command: { id: string; actorId: string }): Promise<void> {
    return this.transactions.run(async () => {
      const user = await requireUser(this.users, command.id);
      await ensureAdministratorStays(this.users, user, command.actorId);
      await this.users.deactivate(user.id);
      await this.audit.record(userAudit('DELETE', user, command.actorId));
    });
  }
}
