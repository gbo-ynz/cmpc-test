import { z } from 'zod';
import type { Author, AuthorInput } from './author.types';

export const NAME_MAX_LENGTH = 160;
export const BIOGRAPHY_MAX_LENGTH = 1000;

/** Today in the user's time zone as YYYY-MM-DD (what a date input compares against). */
export function localToday(now: Date = new Date()): string {
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** Same rules as the API, so most mistakes are caught before sending. Details are optional. */
export const authorFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingrese el nombre')
    .max(NAME_MAX_LENGTH, `Máximo ${NAME_MAX_LENGTH} caracteres`),
  birthDate: z
    .string()
    .refine((value) => value === '' || value <= localToday(), 'La fecha no puede ser futura'),
  biography: z.string().max(BIOGRAPHY_MAX_LENGTH, `Máximo ${BIOGRAPHY_MAX_LENGTH} caracteres`),
});

export type AuthorFormValues = z.infer<typeof authorFormSchema>;

export const EMPTY_AUTHOR_FORM: AuthorFormValues = { name: '', birthDate: '', biography: '' };

/** Empty inputs mean "unknown": they travel as null. */
export const toAuthorInput = ({ name, birthDate, biography }: AuthorFormValues): AuthorInput => ({
  name: name.trim(),
  birthDate: birthDate === '' ? null : birthDate,
  biography: biography.trim() === '' ? null : biography.trim(),
});

export const toAuthorFormValues = ({ name, birthDate, biography }: Author): AuthorFormValues => ({
  name,
  birthDate: birthDate ?? '',
  biography: biography ?? '',
});
