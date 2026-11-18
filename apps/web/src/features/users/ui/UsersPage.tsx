import { Link } from 'react-router-dom';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Pagination } from '../../../shared/ui/Pagination';
import { Spinner } from '../../../shared/ui/Spinner';
import { useUsersPageState } from '../application/user-hooks';
import { UsersTable } from './UsersTable';

/** Admin screen: the people who can sign in, paginated on the server. */
export function UsersPage() {
  const { data, error, isPending, setPage, changeLimit } = useUsersPageState();

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1>Usuarios</h1>
          <p className="muted">{data ? `${data.meta.total} registros` : 'Cargando…'}</p>
        </div>
        <div className="page__actions">
          <Link to="/users/new" className="button button--primary">
            Agregar
          </Link>
        </div>
      </header>
      {error ? <ErrorBanner error={error} title="No se pudieron cargar los usuarios" /> : null}
      {isPending ? <Spinner label="Cargando usuarios" /> : null}
      {data && data.meta.total === 0 ? <EmptyState title="Todavía no hay registros" /> : null}
      {data && data.items.length > 0 ? <UsersTable users={data.items} /> : null}
      {data && data.meta.total > 0 ? (
        <Pagination meta={data.meta} onPageChange={setPage} onLimitChange={changeLimit} />
      ) : null}
    </section>
  );
}
