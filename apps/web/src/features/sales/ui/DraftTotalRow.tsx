import { formatPrice } from '../../../shared/lib/format';

export function DraftTotalRow({ total }: { total: number }) {
  return (
    <tr>
      <th scope="row" colSpan={3}>
        Total
      </th>
      <td className="table__number">
        <strong>{formatPrice(total)}</strong>
      </td>
      <td />
    </tr>
  );
}
