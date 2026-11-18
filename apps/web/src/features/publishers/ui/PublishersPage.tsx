import { Link } from 'react-router-dom';
import { ExportReferencesButton } from '../../references/ui/ExportReferencesButton';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Pagination } from '../../../shared/ui/Pagination';
import { Spinner } from '../../../shared/ui/Spinner';
import { usePublishersPageState } from '../application/usePublishersPageState';
import { PublishersTable } from './PublishersTable';

/** Admin screen: publishers with their country, paginated on the server. */
export function PublishersPage() {
  const { data, error, isPending, setPage, changeLimit } = usePublishersPageState();

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1>Editoriales</h1>
          <p className="muted">{data ? `${data.meta.total} registros` : 'Cargando…'}</p>
        </div>
        <div className="page__actions">
          <ExportReferencesButton kind="publishers" />
          <Link to="/publishers/new" className="button button--primary">
            Agregar
          </Link>
        </div>
      </header>
      {error ? <ErrorBanner error={error} title="No se pudieron cargar las editoriales" /> : null}
      {isPending ? <Spinner label="Cargando editoriales" /> : null}
      {data && data.meta.total === 0 ? <EmptyState title="Todavía no hay registros" /> : null}
      {data && data.items.length > 0 ? <PublishersTable publishers={data.items} /> : null}
      {data && data.meta.total > 0 ? (
        <Pagination meta={data.meta} onPageChange={setPage} onLimitChange={changeLimit} />
      ) : null}
    </section>
  );
}
