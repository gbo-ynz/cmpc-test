import { draftTotal, type DraftLine } from '../domain/sale-draft';
import { DraftLineRow } from './DraftLineRow';
import { DraftTotalRow } from './DraftTotalRow';

interface DraftLinesTableProps {
  lines: readonly DraftLine[];
  onQuantityChange: (bookId: string, quantity: number) => void;
  onRemove: (bookId: string) => void;
}

/** The quantity can never exceed the stock: the API rejects it anyway (RF-16 CA-3). */
export function DraftLinesTable({ lines, onQuantityChange, onRemove }: DraftLinesTableProps) {
  return (
    <div className="table-wrapper card">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Libro</th>
            <th scope="col" className="table__number">
              Precio
            </th>
            <th scope="col" className="table__number">
              Cantidad
            </th>
            <th scope="col" className="table__number">
              Subtotal
            </th>
            <th scope="col" className="table__actions">
              Quitar
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <DraftLineRow
              key={line.bookId}
              line={line}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
            />
          ))}
        </tbody>
        <tfoot>
          <DraftTotalRow total={draftTotal(lines)} />
        </tfoot>
      </table>
    </div>
  );
}
