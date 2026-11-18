import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Spinner } from '../../../shared/ui/Spinner';
import { useDashboard } from '../application/dashboard-hooks';
import { AdministrationSection } from './AdministrationSection';
import { GenreBars } from './GenreBars';
import { InventoryCards, SalesCards } from './OperationCards';

/** Everyone sees the operation; the administration section only arrives for administrators. */
export function DashboardPage() {
  const { data, error, isPending } = useDashboard();
  const administration = data?.administration;

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            {administration ? 'Resumen general del sistema' : 'Resumen de la operación'}
          </p>
        </div>
      </header>
      {error ? <ErrorBanner error={error} title="No se pudo cargar el dashboard" /> : null}
      {isPending ? <Spinner label="Cargando dashboard" /> : null}
      {data ? (
        <>
          <InventoryCards books={data.books} inventoryValue={administration?.inventoryValue} />
          <SalesCards sales={data.sales} />
          <GenreBars genres={data.booksByGenre} />
          {administration ? <AdministrationSection data={administration} /> : null}
        </>
      ) : null}
    </section>
  );
}
