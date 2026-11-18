import { ValidationError } from '../../../shared/domain/domain.error';
import type { Reference } from './reference';

export const BIOGRAPHY_MAX_LENGTH = 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Optional author facts; an unknown value is null. */
export interface AuthorDetails {
  /** Calendar date as YYYY-MM-DD: a birthday is a day, not an instant (no time zone). */
  readonly birthDate: string | null;
  readonly biography: string | null;
}

export interface Author extends Reference, AuthorDetails {}

export interface AuthorSummary extends Author {
  readonly activeBooks: number;
}

/** PATCH semantics: undefined keeps the current value, null clears it. */
export interface AuthorDetailsInput {
  readonly birthDate?: string | null;
  readonly biography?: string | null;
}

export const NO_DETAILS: AuthorDetails = { birthDate: null, biography: null };

/** Rejects malformed or impossible dates (2024-02-30) and dates after `today`. */
export function normalizeBirthDate(raw: string | null, today: Date): string | null {
  if (raw === null) return null;
  const parsed = new Date(`${raw}T00:00:00Z`);
  const isRealDate = ISO_DATE.test(raw) && !Number.isNaN(parsed.getTime());
  if (!isRealDate || parsed.toISOString().slice(0, 10) !== raw) {
    throw new ValidationError('birthDate must be a valid date (YYYY-MM-DD)');
  }
  if (raw > today.toISOString().slice(0, 10)) {
    throw new ValidationError('birthDate cannot be in the future');
  }
  return raw;
}

/** Trimmed; blank means "no biography". Line breaks are kept (it is free text). */
export function normalizeBiography(raw: string | null): string | null {
  const biography = raw?.trim() ?? '';
  if (biography.length > BIOGRAPHY_MAX_LENGTH) {
    throw new ValidationError(`biography must be at most ${BIOGRAPHY_MAX_LENGTH} characters`);
  }
  return biography.length > 0 ? biography : null;
}

/** Applies the received changes over the current details, validating only what changes. */
export function applyAuthorDetails(
  current: AuthorDetails,
  input: AuthorDetailsInput,
  today: Date = new Date(),
): AuthorDetails {
  const { birthDate, biography } = input;
  return {
    birthDate: birthDate === undefined ? current.birthDate : normalizeBirthDate(birthDate, today),
    biography: biography === undefined ? current.biography : normalizeBiography(biography),
  };
}
