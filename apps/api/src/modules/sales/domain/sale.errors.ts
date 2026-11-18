import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/domain.error';

export class SaleNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Sale ${id} not found`);
  }
}

/** Completed and cancelled sales are final. */
export class SaleNotPendingError extends ConflictError {
  constructor() {
    super('Only a pending sale can be completed or cancelled');
  }
}

/** Completing found a book without enough stock (or deleted): nothing is discounted. */
export class InsufficientStockError extends ConflictError {
  constructor(title: string) {
    super(`Not enough stock of "${title}" to complete the sale`);
  }
}

export class InvalidSaleError extends ValidationError {}
