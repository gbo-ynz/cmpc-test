import type { GenreSummary } from '../domain/genre.types';
import { GenreRow } from './GenreRow';

export function GenresTable({ genres }: { genres: readonly GenreSummary[] }) {
  return (
    <div className="table-wrapper card">
      <table className="table catalog-table">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Descripción</th>
            <th scope="col" className="table__center">
              Libros activos
            </th>
            <th scope="col" className="table__actions">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {genres.map((genre) => (
            <GenreRow key={genre.id} genre={genre} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
