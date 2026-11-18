import { SALE_STATUS_LABELS, type SaleStatus } from '../domain/sale.types';

const TONE: Record<SaleStatus, string> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'muted',
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return <span className={`badge badge--${TONE[status]}`}>{SALE_STATUS_LABELS[status]}</span>;
}
