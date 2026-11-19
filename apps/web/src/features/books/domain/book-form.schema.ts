import { z } from 'zod';

// Whole Chilean pesos (CLP has no decimals); same limit as the API.
const MAX_PRICE = 9_999_999_999;
const MAX_STOCK = 1_000_000;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** `label` carries its article ("el título", "la editorial") so messages read naturally. */
const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `Ingrese ${label}`).max(max, `Máximo ${max} caracteres`);

/** Author, publisher and genre are picked from the admin-managed catalogs, never typed. */
const requiredChoice = (label: string) => z.string().min(1, `Seleccione ${label}`);

/** Mirrors the backend invariants so users get feedback before the round trip. */
export const bookFormSchema = z.object({
  title: requiredText('el título', 255),
  authorId: requiredChoice('el autor'),
  publisherId: requiredChoice('la editorial'),
  genreId: requiredChoice('el género'),
  price: z
    .number({ invalid_type_error: 'Ingrese el precio' })
    .min(0, 'El precio no puede ser negativo')
    .max(MAX_PRICE, 'El precio es demasiado alto')
    .int('Ingrese el precio en pesos, sin decimales'),
  stock: z
    .number({ invalid_type_error: 'Ingrese el stock' })
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .max(MAX_STOCK, 'El stock es demasiado alto'),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;

export const EMPTY_BOOK_FORM: BookFormValues = {
  title: '',
  authorId: '',
  publisherId: '',
  genreId: '',
  price: 0,
  stock: 0,
};

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Use una imagen JPEG, PNG o WEBP';
  if (file.size > MAX_IMAGE_BYTES) return 'La imagen debe pesar 2 MB o menos';
  return null;
}
