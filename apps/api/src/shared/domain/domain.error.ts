export type DomainErrorCode = 'NOT_FOUND' | 'VALIDATION' | 'UNAUTHORIZED' | 'CONFLICT';

/** Base class for business-rule violations. Infrastructure maps `code` to transport errors. */
export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION';
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
}
