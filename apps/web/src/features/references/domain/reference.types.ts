/** The three admin-managed catalogs; they share one screen and one API shape. */
export type ReferenceKind = 'authors' | 'publishers' | 'genres';

export interface Reference {
  readonly id: string;
  readonly name: string;
  readonly activeBooks: number;
}

// Spanish grammatical gender differs per kind ("un autor", "una editorial").
export const REFERENCE_COPY: Record<ReferenceKind, { readonly nameTaken: string }> = {
  authors: { nameTaken: 'Ya existe un autor con ese nombre.' },
  publishers: { nameTaken: 'Ya existe una editorial con ese nombre.' },
  genres: { nameTaken: 'Ya existe un género con ese nombre.' },
};

/** Prefix of the downloaded file: libros-2026-11-18.csv style, per catalog. */
export const EXPORT_FILE_PREFIX: Record<ReferenceKind, string> = {
  authors: 'autores',
  publishers: 'editoriales',
  genres: 'generos',
};

/** Port: the UI depends on this contract, not on axios. */
export interface ReferencesGateway {
  list(kind: ReferenceKind): Promise<Reference[]>;
  remove(kind: ReferenceKind, id: string): Promise<void>;
  /** Every record of the catalog (not only the visible page) as a CSV file. */
  exportCsv(kind: ReferenceKind): Promise<Blob>;
}
