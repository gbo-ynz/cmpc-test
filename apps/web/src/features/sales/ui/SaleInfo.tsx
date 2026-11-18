import { formatDate } from '../../../shared/lib/format';
import { PAYMENT_METHOD_LABELS, type Sale } from '../domain/sale.types';

/** Who, when and how: the closing date and payment method appear once the sale is final. */
export function SaleInfo({ sale }: { sale: Sale }) {
  const closedAt = sale.completedAt ?? sale.cancelledAt;
  return (
    <dl className="sale-info card panel">
      <div>
        <dt>Fecha</dt>
        <dd>{formatDate(sale.createdAt)}</dd>
      </div>
      <div>
        <dt>Creada por</dt>
        <dd>{sale.createdBy.name}</dd>
      </div>
      {sale.paymentMethod ? (
        <div>
          <dt>Método de pago</dt>
          <dd>{PAYMENT_METHOD_LABELS[sale.paymentMethod]}</dd>
        </div>
      ) : null}
      {closedAt ? (
        <div>
          <dt>{sale.completedAt ? 'Completada el' : 'Cancelada el'}</dt>
          <dd>{formatDate(closedAt)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
