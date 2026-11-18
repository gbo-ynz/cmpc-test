import { Link } from 'react-router-dom';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Pagination } from '../../../shared/ui/Pagination';
import { SelectField } from '../../../shared/ui/SelectField';
import { Spinner } from '../../../shared/ui/Spinner';
import { useSalesPageState } from '../application/useSalesPageState';
import { SALE_STATUS_LABELS, type SaleStatus } from '../domain/sale.types';
import { SalesTable } from './SalesTable';

const STATUS_OPTIONS = Object.entries(SALE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/** Sales of every user, newest first, paginated on the server and filterable by status. */
export function SalesPage() {
  const { data, error, isPending, status, changeStatus, setPage, changeLimit } =
    useSalesPageState();

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1>Ventas</h1>
          <p className="muted">{data ? `${data.meta.total} ventas` : 'Cargando…'}</p>
        </div>
        <div className="page__actions">
          <Link to="/sales/new" className="button button--primary">
            Nueva venta
          </Link>
        </div>
      </header>
      <div className="sales-filter card">
        <SelectField
          label="Estado"
          placeholder="Todos los estados"
          value={status}
          options={STATUS_OPTIONS}
          onValueChange={(value) => changeStatus(value as SaleStatus | '')}
        />
      </div>
      {error ? <ErrorBanner error={error} title="No se pudieron cargar las ventas" /> : null}
      {isPending ? <Spinner label="Cargando ventas" /> : null}
      {data && data.meta.total === 0 ? <EmptyState title="No hay ventas para mostrar" /> : null}
      {data && data.items.length > 0 ? <SalesTable sales={data.items} /> : null}
      {data && data.meta.total > 0 ? (
        <Pagination meta={data.meta} onPageChange={setPage} onLimitChange={changeLimit} />
      ) : null}
    </section>
  );
}
