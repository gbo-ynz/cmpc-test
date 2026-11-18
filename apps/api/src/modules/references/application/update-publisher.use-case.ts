import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import {
  applyPublisherDetails,
  type Publisher,
  type PublisherDetailsInput,
} from '../domain/publisher';
import { PublisherRepository } from '../domain/publisher.repository';
import { normalizeReferenceName } from '../domain/reference';
import { ReferenceRepository } from '../domain/reference.repository';
import { ensureNameAvailable, referenceAudit } from './reference-commands';
import { requirePublisher } from './require-publisher';

/** Partial update: omitted fields keep their value; null clears the country. */
export interface UpdatePublisherCommand extends PublisherDetailsInput {
  readonly id: string;
  readonly name?: string | null;
  readonly actorId: string;
}

@Injectable()
export class UpdatePublisherUseCase {
  constructor(
    private readonly publishers: PublisherRepository,
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  execute({ id, name, actorId, ...input }: UpdatePublisherCommand): Promise<Publisher> {
    return this.transactions.run(async () => {
      const current = await requirePublisher(this.publishers, id);
      const newName =
        name === undefined ? current.name : normalizeReferenceName('publishers', name ?? '');
      const details = applyPublisherDetails(current, input);
      await ensureNameAvailable(this.references, 'publishers', newName, id);
      const updated = await this.publishers.update(id, newName, details);
      const previous = { name: current.name, country: current.country };
      await this.audit.record(
        referenceAudit('UPDATE', 'publishers', updated, actorId, { previous }),
      );
      return updated;
    });
  }
}
