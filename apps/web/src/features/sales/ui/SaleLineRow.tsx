import { Link } from 'react-router-dom';
import { formatPrice } from '../../../shared/lib/format';
import type { SaleLine } from '../domain/sale.types';

export function SaleLineRow({ line }: { line: SaleLine }) {
  return (
    <tr>
      <td>
        <Link to={`/books/${line.bookId}`} className="table__title">
          {line.title}
        </Link>
      </td>
      <td className="table__number">{line.quantity}</td>
      <td className="table__number">{formatPrice(line.unitPrice)}</td>
      <td className="table__number">{formatPrice(line.unitPrice * line.quantity)}</td>
    </tr>
  );
}
