import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import {
  NO_PUBLISHER_DETAILS,
  applyPublisherDetails,
  type Publisher,
  type PublisherDetailsInput,
} from '../domain/publisher';
import { PublisherRepository } from '../domain/publisher.repository';
import { normalizeReferenceName } from '../domain/reference';
import { ReferenceRepository } from '../domain/reference.repository';
import { ensureNameAvailable, referenceAudit } from './reference-commands';

export interface CreatePublisherCommand extends PublisherDetailsInput {
  readonly name: string;
  readonly actorId: string;
}

/** Same name rules as every catalog, plus an optional country. */
@Injectable()
export class CreatePublisherUseCase {
  constructor(
    private readonly publishers: PublisherRepository,
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  async execute({ name, actorId, ...input }: CreatePublisherCommand): Promise<Publisher> {
    const normalized = normalizeReferenceName('publishers', name);
    const details = applyPublisherDetails(NO_PUBLISHER_DETAILS, input);
    return this.transactions.run(async () => {
      await ensureNameAvailable(this.references, 'publishers', normalized);
      const created = await this.publishers.create(normalized, details);
      await this.audit.record(
        referenceAudit('CREATE', 'publishers', created, actorId, { ...details }),
      );
      return created;
    });
  }
}
