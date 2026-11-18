import { z } from 'zod';
import type { UserInput, UserRole } from './user.types';

export const NAME_MAX_LENGTH = 120;
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `Máximo ${PASSWORD_MAX_LENGTH} caracteres`);

const base = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingrese el nombre')
    .max(NAME_MAX_LENGTH, `Máximo ${NAME_MAX_LENGTH} caracteres`),
  email: z
    .string()
    .trim()
    .min(1, 'Ingrese el correo electrónico')
    .email('Ingrese un correo electrónico válido')
    .max(EMAIL_MAX_LENGTH, `Máximo ${EMAIL_MAX_LENGTH} caracteres`),
  role: z.enum(['ADMIN', 'USER'], { message: 'Seleccione un perfil' }),
});

/** Same rules as the API. Creating requires a password; editing only changes it when typed. */
export const createUserSchema = base.extend({ password });
export const editUserSchema = base.extend({ password: password.or(z.literal('')) });

export type UserFormValues = z.infer<typeof createUserSchema>;
export type UserFormMode = 'create' | 'edit';

export const EMPTY_USER_FORM: UserFormValues = {
  name: '',
  email: '',
  role: 'USER',
  password: '',
};

export const schemaFor = (mode: UserFormMode) =>
  mode === 'create' ? createUserSchema : editUserSchema;

/** An empty password means "keep the current one": it is not sent at all. */
export function toUserInput({ name, email, role, password }: UserFormValues): UserInput {
  const fields = { name: name.trim(), email: email.trim(), role };
  return password === '' ? fields : { ...fields, password };
}

export const toUserFormValues = (user: {
  name: string;
  email: string;
  role: UserRole;
}): UserFormValues => ({ name: user.name, email: user.email, role: user.role, password: '' });
