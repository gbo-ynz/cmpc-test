import { ValidationError } from '../../../shared/domain/domain.error';
import type { Reference } from './reference';

export const COUNTRY_MAX_LENGTH = 80;

/** Optional publisher facts; an unknown value is null. */
export interface PublisherDetails {
  readonly country: string | null;
}

export interface Publisher extends Reference, PublisherDetails {}

export interface PublisherSummary extends Publisher {
  readonly activeBooks: number;
}

/** PATCH semantics: undefined keeps the current value, null clears it. */
export interface PublisherDetailsInput {
  readonly country?: string | null;
}

export const NO_PUBLISHER_DETAILS: PublisherDetails = { country: null };

/** Trimmed with inner spaces collapsed; blank means "unknown country". */
export function normalizeCountry(raw: string | null): string | null {
  const country = raw?.trim().replace(/\s+/g, ' ') ?? '';
  if (country.length > COUNTRY_MAX_LENGTH) {
    throw new ValidationError(`country must be at most ${COUNTRY_MAX_LENGTH} characters`);
  }
  return country.length > 0 ? country : null;
}

/** Applies the received changes over the current details, validating only what changes. */
export function applyPublisherDetails(
  current: PublisherDetails,
  { country }: PublisherDetailsInput,
): PublisherDetails {
  return { country: country === undefined ? current.country : normalizeCountry(country) };
}
