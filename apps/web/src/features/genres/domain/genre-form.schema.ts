import { z } from 'zod';
import type { Genre, GenreInput } from './genre.types';

export const NAME_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 500;

/** Same rules as the API, so most mistakes are caught before sending. The description is optional. */
export const genreFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingrese el nombre')
    .max(NAME_MAX_LENGTH, `Máximo ${NAME_MAX_LENGTH} caracteres`),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH, `Máximo ${DESCRIPTION_MAX_LENGTH} caracteres`),
});

export type GenreFormValues = z.infer<typeof genreFormSchema>;

export const EMPTY_GENRE_FORM: GenreFormValues = { name: '', description: '' };

/** An empty input means "unknown": it travels as null. */
export const toGenreInput = ({ name, description }: GenreFormValues): GenreInput => ({
  name: name.trim(),
  description: description.trim() === '' ? null : description.trim(),
});

export const toGenreFormValues = ({ name, description }: Genre): GenreFormValues => ({
  name,
  description: description ?? '',
});
