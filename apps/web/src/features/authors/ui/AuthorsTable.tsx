import type { AuthorSummary } from '../domain/author.types';
import { AuthorRow } from './AuthorRow';

export function AuthorsTable({ authors }: { authors: readonly AuthorSummary[] }) {
  return (
    <div className="table-wrapper card">
      <table className="table catalog-table">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Nacimiento</th>
            <th scope="col">Biografía</th>
            <th scope="col" className="table__center">
              Libros activos
            </th>
            <th scope="col" className="table__actions">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {authors.map((author) => (
            <AuthorRow key={author.id} author={author} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
