import { Injectable } from '@nestjs/common';
import type { ReferenceKind, ReferenceSummary } from '../domain/reference';
import { ReferenceRepository } from '../domain/reference.repository';

/** All records of a kind (not only those with active books): book forms and admin screens need them. */
@Injectable()
export class ListReferencesUseCase {
  constructor(private readonly references: ReferenceRepository) {}

  execute(kind: ReferenceKind): Promise<ReferenceSummary[]> {
    return this.references.list(kind);
  }
}
