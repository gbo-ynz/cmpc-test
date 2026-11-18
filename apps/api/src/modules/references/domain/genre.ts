import { ValidationError } from '../../../shared/domain/domain.error';
import type { Reference } from './reference';

export const DESCRIPTION_MAX_LENGTH = 500;

/** Optional genre facts; an unknown value is null. */
export interface GenreDetails {
  readonly description: string | null;
}

export interface Genre extends Reference, GenreDetails {}

export interface GenreSummary extends Genre {
  readonly activeBooks: number;
}

/** PATCH semantics: undefined keeps the current value, null clears it. */
export interface GenreDetailsInput {
  readonly description?: string | null;
}

export const NO_GENRE_DETAILS: GenreDetails = { description: null };

/** Trimmed; blank means "no description". Line breaks are kept (it is free text). */
export function normalizeDescription(raw: string | null): string | null {
  const description = raw?.trim() ?? '';
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(`description must be at most ${DESCRIPTION_MAX_LENGTH} characters`);
  }
  return description.length > 0 ? description : null;
}

/** Applies the received changes over the current details, validating only what changes. */
export function applyGenreDetails(
  current: GenreDetails,
  { description }: GenreDetailsInput,
): GenreDetails {
  return {
    description:
      description === undefined ? current.description : normalizeDescription(description),
  };
}
