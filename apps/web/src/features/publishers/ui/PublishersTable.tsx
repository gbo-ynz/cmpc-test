import type { PublisherSummary } from '../domain/publisher.types';
import { PublisherRow } from './PublisherRow';

export function PublishersTable({ publishers }: { publishers: readonly PublisherSummary[] }) {
  return (
    <div className="table-wrapper card">
      <table className="table catalog-table">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">País</th>
            <th scope="col" className="table__center">
              Libros activos
            </th>
            <th scope="col" className="table__actions">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {publishers.map((publisher) => (
            <PublisherRow key={publisher.id} publisher={publisher} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
