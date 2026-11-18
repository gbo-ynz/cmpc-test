import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Spinner } from '../../../shared/ui/Spinner';
import { useReferences } from '../application/reference-hooks';
import { REFERENCE_COPY, type ReferenceKind } from '../domain/reference.types';
import { ReferenceCreateForm } from './ReferenceCreateForm';
import { ReferenceRow } from './ReferenceRow';

/** Admin screen shared by authors, publishers and genres. */
export function ReferencesPage({ kind }: { kind: ReferenceKind }) {
  const copy = REFERENCE_COPY[kind];
  const { data, error, isPending } = useReferences(kind);

  return (
    <section className="page page--narrow">
      <header className="page__header">
        <div>
          <h1>{copy.title}</h1>
          <p className="muted">{data ? `${data.length} registros` : 'Cargando…'}</p>
        </div>
      </header>
      <ReferenceCreateForm kind={kind} />
      {error ? (
        <ErrorBanner
          error={error}
          title={`No se pudieron cargar los ${copy.title.toLowerCase()}`}
        />
      ) : null}
      {isPending ? <Spinner label={`Cargando ${copy.title.toLowerCase()}`} /> : null}
      {data && data.length === 0 ? <EmptyState title="Todavía no hay registros" /> : null}
      {data && data.length > 0 ? (
        <div className="table-wrapper card">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col" className="table__center">
                  Libros activos
                </th>
                <th scope="col" className="table__actions">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((reference) => (
                <ReferenceRow key={reference.id} kind={kind} reference={reference} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
