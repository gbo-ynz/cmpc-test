import { Link, useParams } from 'react-router-dom';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Spinner } from '../../../shared/ui/Spinner';
import { useSale } from '../application/sale-hooks';
import { CancelSaleButton } from './CancelSaleButton';
import { CompleteSalePanel } from './CompleteSalePanel';
import { SaleInfo } from './SaleInfo';
import { SaleLinesTable } from './SaleLinesTable';
import { SaleStatusBadge } from './SaleStatusBadge';

/** Only a pending sale offers actions: completed and cancelled sales are final. */
export default function SaleDetailPage() {
  const { id = '' } = useParams();
  const { data: sale, error, isPending } = useSale(id);

  if (isPending) return <Spinner label="Cargando venta" />;
  if (error || !sale) return <ErrorBanner error={error} title="No se pudo cargar la venta" />;

  return (
    <section className="page">
      <nav className="breadcrumbs">
        <Link to="/sales">← Volver a ventas</Link>
      </nav>
      <header className="page__header">
        <h1>Venta</h1>
        <SaleStatusBadge status={sale.status} />
      </header>
      <SaleInfo sale={sale} />
      <SaleLinesTable sale={sale} />
      {sale.status === 'PENDING' ? (
        <div className="sale-actions">
          <CompleteSalePanel saleId={sale.id} />
          <CancelSaleButton saleId={sale.id} />
        </div>
      ) : null}
    </section>
  );
}
