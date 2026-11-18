import { NotFoundError, ValidationError } from '../../../shared/domain/domain.error';

export class BookNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Book ${id} was not found`);
  }
}

export class InvalidBookError extends ValidationError {}
