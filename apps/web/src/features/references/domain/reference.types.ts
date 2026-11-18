/** The three admin-managed catalogs; they share one screen and one API shape. */
export type ReferenceKind = 'authors' | 'publishers' | 'genres';

export interface Reference {
  readonly id: string;
  readonly name: string;
  readonly activeBooks: number;
}

interface ReferenceCopy {
  readonly title: string;
  readonly newLabel: string;
  readonly nameTaken: string;
  readonly maxLength: number;
}

// Spanish grammatical gender differs per kind ("nuevo autor", "nueva editorial").
export const REFERENCE_COPY: Record<ReferenceKind, ReferenceCopy> = {
  authors: {
    title: 'Autores',
    newLabel: 'Nuevo autor',
    nameTaken: 'Ya existe un autor con ese nombre.',
    maxLength: 160,
  },
  publishers: {
    title: 'Editoriales',
    newLabel: 'Nueva editorial',
    nameTaken: 'Ya existe una editorial con ese nombre.',
    maxLength: 160,
  },
  genres: {
    title: 'Géneros',
    newLabel: 'Nuevo género',
    nameTaken: 'Ya existe un género con ese nombre.',
    maxLength: 80,
  },
};

/** Port: the UI depends on this contract, not on axios. */
export interface ReferencesGateway {
  list(kind: ReferenceKind): Promise<Reference[]>;
  create(kind: ReferenceKind, name: string): Promise<Reference>;
  rename(kind: ReferenceKind, id: string, name: string): Promise<Reference>;
  remove(kind: ReferenceKind, id: string): Promise<void>;
}
