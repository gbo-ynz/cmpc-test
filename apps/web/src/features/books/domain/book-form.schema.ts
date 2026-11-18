import { z } from 'zod';

const MAX_PRICE = 9_999_999_999.99;
const TWO_DECIMALS = /^\d+(\.\d{1,2})?$/;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** `label` carries its article ("el título", "la editorial") so messages read naturally. */
const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `Ingrese ${label}`).max(max, `Máximo ${max} caracteres`);

/** Mirrors the backend invariants so users get feedback before the round trip. */
export const bookFormSchema = z.object({
  title: requiredText('el título', 255),
  author: requiredText('el autor', 160),
  publisher: requiredText('la editorial', 160),
  genre: requiredText('el género', 80),
  price: z
    .number({ invalid_type_error: 'Ingrese el precio' })
    .min(0, 'El precio no puede ser negativo')
    .max(MAX_PRICE, 'El precio es demasiado alto')
    .refine((value) => TWO_DECIMALS.test(String(value)), 'Use como máximo 2 decimales'),
  isAvailable: z.boolean(),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;

export const EMPTY_BOOK_FORM: BookFormValues = {
  title: '',
  author: '',
  publisher: '',
  genre: '',
  price: 0,
  isAvailable: true,
};

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Use una imagen JPEG, PNG o WEBP';
  if (file.size > MAX_IMAGE_BYTES) return 'La imagen debe pesar 2 MB o menos';
  return null;
}
