import type { Page } from '../../../shared/api/envelope';

export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'TRANSFER';

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  DEBIT_CARD: 'Tarjeta de débito',
  CREDIT_CARD: 'Tarjeta de crédito',
  TRANSFER: 'Transferencia',
};

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export interface SaleLine {
  readonly bookId: string;
  readonly title: string;
  readonly quantity: number;
  /** Price when the sale was created: later price changes never alter it. */
  readonly unitPrice: number;
}

export interface SaleSummary {
  readonly id: string;
  readonly status: SaleStatus;
  readonly total: number;
  readonly itemCount: number;
  readonly createdAt: string;
  readonly createdBy: { readonly id: string; readonly name: string };
}

export interface Sale extends SaleSummary {
  readonly paymentMethod: PaymentMethod | null;
  readonly completedAt: string | null;
  readonly cancelledAt: string | null;
  readonly items: readonly SaleLine[];
}

export interface SaleLineInput {
  readonly bookId: string;
  readonly quantity: number;
}

export interface SalePageParams {
  readonly page: number;
  readonly limit: number;
  readonly status?: SaleStatus;
}

/** Port: the UI depends on this contract, not on axios. */
export interface SalesGateway {
  listPage(params: SalePageParams): Promise<Page<SaleSummary>>;
  get(id: string): Promise<Sale>;
  create(items: readonly SaleLineInput[]): Promise<Sale>;
  complete(id: string, paymentMethod: PaymentMethod): Promise<Sale>;
  cancel(id: string): Promise<Sale>;
}
