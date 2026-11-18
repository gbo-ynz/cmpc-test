export const SALE_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED'] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const PAYMENT_METHODS = ['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface SaleActor {
  readonly id: string;
  readonly name: string;
}

/** One line: `unitPrice` is the book price when the sale was created, never updated afterwards. */
export interface SaleLine {
  readonly bookId: string;
  readonly title: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface SaleSummary {
  readonly id: string;
  readonly status: SaleStatus;
  readonly total: number;
  /** Units sold: two copies of one book count 2, not 1. */
  readonly unitCount: number;
  readonly createdAt: Date;
  readonly createdBy: SaleActor;
}

export interface Sale extends SaleSummary {
  readonly paymentMethod: PaymentMethod | null;
  readonly completedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly items: readonly SaleLine[];
}

export interface NewSale {
  readonly createdById: string;
  readonly total: number;
  readonly items: ReadonlyArray<Pick<SaleLine, 'bookId' | 'quantity' | 'unitPrice'>>;
}

/** A book that can be put on a sale: active, with its current price and stock. */
export interface SellableBook {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly stock: number;
}
