import { toCsvDocument } from '../../../shared/application/csv';
import type { AuthorSummary } from '../domain/author';
import type { GenreSummary } from '../domain/genre';
import type { PublisherSummary } from '../domain/publisher';

// Headers are what the end user sees when opening the file in Excel.
export const authorsToCsv = (authors: readonly AuthorSummary[]): string =>
  toCsvDocument(
    ['ID', 'Nombre', 'Fecha de nacimiento', 'Biografía', 'Libros activos'],
    authors.map((a) => [a.id, a.name, a.birthDate, a.biography, a.activeBooks]),
  );

export const publishersToCsv = (publishers: readonly PublisherSummary[]): string =>
  toCsvDocument(
    ['ID', 'Nombre', 'País', 'Libros activos'],
    publishers.map((p) => [p.id, p.name, p.country, p.activeBooks]),
  );

export const genresToCsv = (genres: readonly GenreSummary[]): string =>
  toCsvDocument(
    ['ID', 'Nombre', 'Descripción', 'Libros activos'],
    genres.map((g) => [g.id, g.name, g.description, g.activeBooks]),
  );
