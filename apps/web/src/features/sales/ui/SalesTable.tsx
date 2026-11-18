import type { SaleSummary } from '../domain/sale.types';
import { SaleRow } from './SaleRow';

export function SalesTable({ sales }: { sales: readonly SaleSummary[] }) {
  return (
    <div className="table-wrapper card">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col" className="table__number">
              Productos
            </th>
            <th scope="col" className="table__number">
              Total
            </th>
            <th scope="col">Estado</th>
            <th scope="col">Creada por</th>
            <th scope="col" className="table__actions">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <SaleRow key={sale.id} sale={sale} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
