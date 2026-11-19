import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/domain.error';

export class BookNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Book ${id} was not found`);
  }
}

export class InvalidBookError extends ValidationError {}

/** Among active books, title (ignoring case), author and publisher identify a book. */
export class DuplicateBookError extends ConflictError {
  constructor(title: string) {
    super(`"${title}" already exists with the same author and publisher`);
  }
}
