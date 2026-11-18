import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { useCreateSale } from '../application/sale-hooks';
import { useSaleDraft } from '../application/useSaleDraft';
import { toSaleInput } from '../domain/sale-draft';
import { BookPicker } from './BookPicker';
import { DraftLinesTable } from './DraftLinesTable';

/** Builds the lines, then creates a pending sale (no stock is discounted until it is completed). */
export default function SaleCreatePage() {
  const { lines, add, changeQuantity, remove } = useSaleDraft();
  const create = useCreateSale();
  const navigate = useNavigate();

  const submit = async () => {
    try {
      const sale = await create.mutateAsync(toSaleInput(lines));
      navigate(`/sales/${sale.id}`);
    } catch {
      // Rendered below from create.error.
    }
  };

  return (
    <section className="page">
      <nav className="breadcrumbs">
        <Link to="/sales">← Volver a ventas</Link>
      </nav>
      <h1>Nueva venta</h1>
      {create.isError ? (
        <ErrorBanner error={create.error} title="No se pudo crear la venta" />
      ) : null}
      <BookPicker onPick={add} />
      {lines.length > 0 ? (
        <DraftLinesTable lines={lines} onQuantityChange={changeQuantity} onRemove={remove} />
      ) : (
        <p className="muted">Agregue al menos un libro para crear la venta.</p>
      )}
      <div className="form__actions">
        <Button
          variant="primary"
          disabled={lines.length === 0}
          isLoading={create.isPending}
          onClick={submit}
        >
          Crear venta
        </Button>
      </div>
    </section>
  );
}
