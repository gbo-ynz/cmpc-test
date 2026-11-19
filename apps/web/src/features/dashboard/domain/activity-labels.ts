const ACTIONS: Record<string, string> = {
  CREATE: 'Creó',
  UPDATE: 'Editó',
  DELETE: 'Eliminó',
  UPLOAD_IMAGE: 'Subió la portada del',
  COMPLETE: 'Completó',
  CANCEL: 'Canceló',
};

const ENTITIES: Record<string, string> = {
  Book: 'libro',
  Author: 'autor',
  Publisher: 'editorial',
  Genre: 'género',
  User: 'usuario',
  Sale: 'venta',
};

const PLURALS: Record<string, string> = {
  libro: 'libros',
  autor: 'autores',
  editorial: 'editoriales',
  género: 'géneros',
  usuario: 'usuarios',
  venta: 'ventas',
};

/**
 * One audit entry as a sentence ("Creó libro"). A login has no record to name and an export
 * names the whole catalog; unknown actions or entities are shown as they come, never hidden.
 */
export function describeActivity(action: string, entityType: string): string {
  const entity = ENTITIES[entityType] ?? entityType;
  if (action === 'LOGIN') return 'Inició sesión';
  if (action === 'LOGIN_FAILED') return 'Intento fallido de inicio de sesión';
  if (action === 'EXPORT') return `Exportó ${PLURALS[entity] ?? entity}`;
  return `${ACTIONS[action] ?? action} ${entity}`;
}
