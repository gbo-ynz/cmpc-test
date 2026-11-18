import { formatPrice } from '../../../shared/lib/format';
import type { BookStats, SalesStats } from '../domain/dashboard.types';
import { StatCard } from './StatCard';

interface InventoryCardsProps {
  books: BookStats;
  /** Administrators only: the value of the available stock. */
  inventoryValue?: number;
}

export function InventoryCards({ books, inventoryValue }: InventoryCardsProps) {
  return (
    <section aria-labelledby="dashboard-inventory">
      <h2 id="dashboard-inventory">Inventario</h2>
      <dl className="stat-grid">
        <StatCard label="Libros activos" value={books.active} to="/books" />
        <StatCard label="Disponibles" value={books.available} />
        <StatCard label="No disponibles" value={books.unavailable} />
        {inventoryValue === undefined ? null : (
          <StatCard label="Valor del inventario disponible" value={formatPrice(inventoryValue)} />
        )}
      </dl>
    </section>
  );
}

export function SalesCards({ sales }: { sales: SalesStats }) {
  return (
    <section aria-labelledby="dashboard-sales">
      <h2 id="dashboard-sales">Ventas</h2>
      <dl className="stat-grid">
        <StatCard label="Ventas pendientes" value={sales.pending} to="/sales" />
        <StatCard label="Ventas completadas" value={sales.completed} />
        <StatCard label="Monto vendido" value={formatPrice(sales.completedAmount)} />
      </dl>
    </section>
  );
}
