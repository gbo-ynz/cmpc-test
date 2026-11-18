import type { Page } from '../../../shared/api/envelope';

export interface Author {
  readonly id: string;
  readonly name: string;
  /** Calendar date YYYY-MM-DD, or null when unknown. */
  readonly birthDate: string | null;
  readonly biography: string | null;
}

export interface AuthorSummary extends Author {
  readonly activeBooks: number;
}

export interface AuthorInput {
  readonly name: string;
  readonly birthDate: string | null;
  readonly biography: string | null;
}

export interface AuthorPageParams {
  readonly page: number;
  readonly limit: number;
}

/** Port: the UI depends on this contract, not on axios. Deleting uses the shared catalog port. */
export interface AuthorsGateway {
  /** One server-side page (select options go through the shared catalog port). */
  listPage(params: AuthorPageParams): Promise<Page<AuthorSummary>>;
  get(id: string): Promise<Author>;
  create(input: AuthorInput): Promise<Author>;
  update(id: string, input: AuthorInput): Promise<Author>;
}

// Explicit parts: es-CL's "medium" style is numeric (07-04-1889), harder to read in a table.
const BIRTH_DATE_FORMAT = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "1889-04-07" → "7 abr 1889". UTC on both sides: a birthday must not shift a day. */
export const formatBirthDate = (birthDate: string): string =>
  BIRTH_DATE_FORMAT.format(new Date(`${birthDate}T00:00:00Z`));
