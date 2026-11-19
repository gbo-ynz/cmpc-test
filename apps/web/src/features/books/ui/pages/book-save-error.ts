import { errorText } from '../../../../shared/api/api-error';

/** A 409 when saving a book means another active one has the same title, author and publisher. */
export const bookSaveErrorText = (error: unknown): string =>
  errorText(error, { CONFLICT: 'Ya existe un libro con ese título, autor y editorial.' });
