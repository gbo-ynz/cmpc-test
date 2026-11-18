import { Link } from 'react-router-dom';
import { ExportReferencesButton } from '../../references/ui/ExportReferencesButton';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Pagination } from '../../../shared/ui/Pagination';
import { Spinner } from '../../../shared/ui/Spinner';
import { useAuthorsPageState } from '../application/useAuthorsPageState';
import { AuthorsTable } from './AuthorsTable';

/** Admin screen: authors with birth date and biography, paginated on the server. */
export function AuthorsPage() {
  const { data, error, isPending, setPage, changeLimit } = useAuthorsPageState();

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1>Autores</h1>
          <p className="muted">{data ? `${data.meta.total} registros` : 'Cargando…'}</p>
        </div>
        <div className="page__actions">
          <ExportReferencesButton kind="authors" />
          <Link to="/authors/new" className="button button--primary">
            Agregar
          </Link>
        </div>
      </header>
      {error ? <ErrorBanner error={error} title="No se pudieron cargar los autores" /> : null}
      {isPending ? <Spinner label="Cargando autores" /> : null}
      {data && data.meta.total === 0 ? <EmptyState title="Todavía no hay registros" /> : null}
      {data && data.items.length > 0 ? <AuthorsTable authors={data.items} /> : null}
      {data && data.meta.total > 0 ? (
        <Pagination meta={data.meta} onPageChange={setPage} onLimitChange={changeLimit} />
      ) : null}
    </section>
  );
}
