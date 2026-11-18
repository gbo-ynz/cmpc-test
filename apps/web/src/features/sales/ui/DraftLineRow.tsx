import { formatPrice } from '../../../shared/lib/format';
import { IconButton } from '../../../shared/ui/IconButton';
import { TrashIcon } from '../../../shared/ui/icons';
import type { DraftLine } from '../domain/sale-draft';

interface DraftLineRowProps {
  line: DraftLine;
  onQuantityChange: (bookId: string, quantity: number) => void;
  onRemove: (bookId: string) => void;
}

export function DraftLineRow({ line, onQuantityChange, onRemove }: DraftLineRowProps) {
  return (
    <tr>
      <td>{line.title}</td>
      <td className="table__number">{formatPrice(line.unitPrice)}</td>
      <td className="table__number">
        <input
          type="number"
          className="field__control quantity-input"
          aria-label={`Cantidad de ${line.title}`}
          min={1}
          max={line.stock}
          value={line.quantity}
          onChange={(event) => onQuantityChange(line.bookId, event.target.valueAsNumber)}
        />
      </td>
      <td className="table__number">{formatPrice(line.unitPrice * line.quantity)}</td>
      <td className="table__actions">
        <IconButton
          label={`Quitar ${line.title}`}
          tone="danger"
          onClick={() => onRemove(line.bookId)}
        >
          <TrashIcon />
        </IconButton>
      </td>
    </tr>
  );
}
