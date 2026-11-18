import { formatPrice } from '../../../shared/lib/format';
import type { Sale } from '../domain/sale.types';
import { SaleLineRow } from './SaleLineRow';

/** Unit prices are the ones saved when the sale was created, not the books' current prices. */
export function SaleLinesTable({ sale }: { sale: Sale }) {
  return (
    <div className="table-wrapper card">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Libro</th>
            <th scope="col" className="table__number">
              Cantidad
            </th>
            <th scope="col" className="table__number">
              Precio unitario
            </th>
            <th scope="col" className="table__number">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((line) => (
            <SaleLineRow key={line.bookId} line={line} />
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>
              Total
            </th>
            <td className="table__number">
              <strong>{formatPrice(sale.total)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
