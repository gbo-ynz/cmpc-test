import { z } from 'zod';

export type { AuthUser, Session } from '../../../shared/auth/session-storage';

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingrese su correo electrónico')
    .email('Ingrese un correo electrónico válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
});

export type Credentials = z.infer<typeof credentialsSchema>;
