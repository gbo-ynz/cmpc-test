import { ConflictError, NotFoundError } from '../../../shared/domain/domain.error';
import { REFERENCE_KINDS, type ReferenceKind } from './reference';

export class ReferenceNotFoundError extends NotFoundError {
  constructor(kind: ReferenceKind, id: string) {
    super(`${REFERENCE_KINDS[kind].entityType} ${id} not found`);
  }
}

/** Names are unique ignoring case: "Novela" and "novela" are the same genre. */
export class ReferenceNameTakenError extends ConflictError {
  constructor(name: string) {
    super(`"${name}" already exists`);
  }
}

/** Books (active or soft-deleted) keep pointing to it: deleting would break their history. */
export class ReferenceInUseError extends ConflictError {
  constructor(readonly books: number) {
    super(`It has ${books} associated book(s) and cannot be deleted`);
  }
}
