import { Prisma } from '@prisma/client';
import type { Book } from '../../domain/book';
import { DuplicateBookError } from '../../domain/book.errors';

/**
 * Same expression as the partial unique index `books_active_identity_key`
 * (lower(title), author_id, publisher_id WHERE deleted_at IS NULL), so both always agree.
 */
export async function hasActiveDuplicate(
  db: Prisma.TransactionClient,
  book: Book,
): Promise<boolean> {
  const { title, author, publisher } = book.snapshot();
  const rows = await db.$queryRaw<unknown[]>`
    SELECT 1 FROM books
    WHERE id <> ${book.id}::uuid AND deleted_at IS NULL
      AND author_id = ${author.id}::uuid AND publisher_id = ${publisher.id}::uuid
      AND lower(title) = lower(${title})
    LIMIT 1`;
  return rows.length > 0;
}

/** Two concurrent requests can both pass the check: the index rejects the second one (P2002). */
export function asDuplicateError(error: unknown, book: Book): unknown {
  const isUniqueViolation =
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  return isUniqueViolation ? new DuplicateBookError(book.snapshot().title) : error;
}
