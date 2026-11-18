import { ValidationError } from '../../../shared/domain/domain.error';

/** The three admin-managed catalogs share every rule; only these details differ between them. */
export const REFERENCE_KINDS = {
  authors: { entityType: 'Author', maxLength: 160 },
  publishers: { entityType: 'Publisher', maxLength: 160 },
  genres: { entityType: 'Genre', maxLength: 80 },
} as const;

export type ReferenceKind = keyof typeof REFERENCE_KINDS;

export interface Reference {
  readonly id: string;
  readonly name: string;
}

export interface ReferenceSummary extends Reference {
  readonly activeBooks: number;
}

/** Trims and collapses inner spaces so "  Gabriel   García " and "Gabriel García" are the same name. */
export function normalizeReferenceName(kind: ReferenceKind, raw: string | undefined): string {
  const name = raw?.trim().replace(/\s+/g, ' ') ?? '';
  const { maxLength } = REFERENCE_KINDS[kind];
  if (name.length === 0) throw new ValidationError('name is required');
  if (name.length > maxLength) {
    throw new ValidationError(`name must be at most ${maxLength} characters`);
  }
  return name;
}
