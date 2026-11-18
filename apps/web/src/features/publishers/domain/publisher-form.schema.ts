import { z } from 'zod';
import type { Publisher, PublisherInput } from './publisher.types';

export const NAME_MAX_LENGTH = 160;
export const COUNTRY_MAX_LENGTH = 80;

/** Same rules as the API, so most mistakes are caught before sending. The country is optional. */
export const publisherFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingrese el nombre')
    .max(NAME_MAX_LENGTH, `Máximo ${NAME_MAX_LENGTH} caracteres`),
  country: z.string().max(COUNTRY_MAX_LENGTH, `Máximo ${COUNTRY_MAX_LENGTH} caracteres`),
});

export type PublisherFormValues = z.infer<typeof publisherFormSchema>;

export const EMPTY_PUBLISHER_FORM: PublisherFormValues = { name: '', country: '' };

/** An empty input means "unknown": it travels as null. */
export const toPublisherInput = ({ name, country }: PublisherFormValues): PublisherInput => ({
  name: name.trim(),
  country: country.trim() === '' ? null : country.trim(),
});

export const toPublisherFormValues = ({ name, country }: Publisher): PublisherFormValues => ({
  name,
  country: country ?? '',
});
