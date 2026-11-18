import { Link } from 'react-router-dom';
import { formatDate, formatPrice } from '../../../shared/lib/format';
import type { SaleSummary } from '../domain/sale.types';
import { SaleStatusBadge } from './SaleStatusBadge';

export function SaleRow({ sale }: { sale: SaleSummary }) {
  return (
    <tr>
      <td>{formatDate(sale.createdAt)}</td>
      <td className="table__number">{sale.itemCount}</td>
      <td className="table__number">{formatPrice(sale.total)}</td>
      <td>
        <SaleStatusBadge status={sale.status} />
      </td>
      <td>{sale.createdBy.name}</td>
      <td className="table__actions">
        <Link
          to={`/sales/${sale.id}`}
          className="button button--ghost"
          aria-label={`Ver venta del ${formatDate(sale.createdAt)} por ${formatPrice(sale.total)}`}
        >
          Ver
        </Link>
      </td>
    </tr>
  );
}
