/**
 * User-facing copy for API error codes. The API contract stays language-neutral
 * (stable `code`); the UI owns the wording shown to the user.
 */
const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'No se pudo conectar con el servidor. Revise su conexión.',
  BAD_REQUEST: 'Los datos enviados no son válidos.',
  VALIDATION: 'Los datos enviados no son válidos.',
  UNAUTHORIZED: 'Correo electrónico o contraseña incorrectos.',
  FORBIDDEN: 'No tiene permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no existe o fue eliminado.',
  CONFLICT: 'La operación entra en conflicto con datos existentes.',
  PAYLOAD_TOO_LARGE: 'El archivo supera el tamaño máximo permitido (2 MB).',
  UNSUPPORTED_MEDIA_TYPE: 'Formato de archivo no permitido. Use JPEG, PNG o WEBP.',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espere un minuto e intente nuevamente.',
  INTERNAL_ERROR: 'Ocurrió un error inesperado. Intente nuevamente más tarde.',
};

export const DEFAULT_ERROR_MESSAGE = 'Ocurrió un error inesperado.';

export const messageForCode = (code: string): string => MESSAGES[code] ?? DEFAULT_ERROR_MESSAGE;
