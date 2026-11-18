import { ConflictError, NotFoundError } from '../../../shared/domain/domain.error';

export class UserNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`User ${id} not found`);
  }
}

/** Deactivated users keep their email: the unique index also covers them. */
export class EmailTakenError extends ConflictError {
  constructor(email: string) {
    super(`The email "${email}" is already registered`);
  }
}

/** An administrator cannot delete or demote their own account. */
export class SelfProtectionError extends ConflictError {
  constructor() {
    super('You cannot delete your own account or remove your own administrator profile');
  }
}

export class LastAdministratorError extends ConflictError {
  constructor() {
    super('At least one active administrator must remain');
  }
}
