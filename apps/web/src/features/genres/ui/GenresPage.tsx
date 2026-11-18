import { Link } from 'react-router-dom';
import { ExportReferencesButton } from '../../references/ui/ExportReferencesButton';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Pagination } from '../../../shared/ui/Pagination';
import { Spinner } from '../../../shared/ui/Spinner';
import { useGenresPageState } from '../application/useGenresPageState';
import { GenresTable } from './GenresTable';

/** Admin screen: genres with their description, paginated on the server. */
export function GenresPage() {
  const { data, error, isPending, setPage, changeLimit } = useGenresPageState();

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1>Géneros</h1>
          <p className="muted">{data ? `${data.meta.total} registros` : 'Cargando…'}</p>
        </div>
        <div className="page__actions">
          <ExportReferencesButton kind="genres" />
          <Link to="/genres/new" className="button button--primary">
            Agregar
          </Link>
        </div>
      </header>
      {error ? <ErrorBanner error={error} title="No se pudieron cargar los géneros" /> : null}
      {isPending ? <Spinner label="Cargando géneros" /> : null}
      {data && data.meta.total === 0 ? <EmptyState title="Todavía no hay registros" /> : null}
      {data && data.items.length > 0 ? <GenresTable genres={data.items} /> : null}
      {data && data.meta.total > 0 ? (
        <Pagination meta={data.meta} onPageChange={setPage} onLimitChange={changeLimit} />
      ) : null}
    </section>
  );
}
