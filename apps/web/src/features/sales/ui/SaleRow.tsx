import { Link } from 'react-router-dom';
import { formatDate, formatPrice } from '../../../shared/lib/format';
import type { SaleSummary } from '../domain/sale.types';
import { EyeIcon } from '../../../shared/ui/sale-icons';
import { CancelSaleButton } from './CancelSaleButton';
import { CompleteSaleAction } from './CompleteSaleAction';
import { SaleStatusBadge } from './SaleStatusBadge';

export function SaleRow({ sale }: { sale: SaleSummary }) {
  const what = `venta del ${formatDate(sale.createdAt)} por ${formatPrice(sale.total)}`;
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
        <div className="icon-group">
          <Link
            to={`/sales/${sale.id}`}
            className="icon-button icon-button--default"
            aria-label={`Ver ${what}`}
            title={`Ver ${what}`}
          >
            <EyeIcon />
          </Link>
          {sale.status === 'PENDING' ? (
            <>
              <CompleteSaleAction saleId={sale.id} label={`Completar ${what}`} />
              <CancelSaleButton saleId={sale.id} compact label={`Cancelar ${what}`} />
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
