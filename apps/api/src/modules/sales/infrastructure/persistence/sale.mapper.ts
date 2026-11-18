import type { Prisma } from '@prisma/client';
import type { Sale, SaleSummary } from '../../domain/sale';

const CREATOR = { select: { id: true, name: true } } as const;

export const SUMMARY_SELECT = {
  id: true,
  status: true,
  total: true,
  createdAt: true,
  createdBy: CREATOR,
  _count: { select: { items: true } },
} as const satisfies Prisma.SaleSelect;

export const DETAIL_SELECT = {
  ...SUMMARY_SELECT,
  paymentMethod: true,
  completedAt: true,
  cancelledAt: true,
  items: {
    select: { bookId: true, quantity: true, unitPrice: true, book: { select: { title: true } } },
    orderBy: [{ book: { title: 'asc' } }, { bookId: 'asc' }],
  },
} as const satisfies Prisma.SaleSelect;

// The id breaks ties so pages stay stable when two sales share a timestamp.
export const ORDER_BY: Prisma.SaleOrderByWithRelationInput[] = [
  { createdAt: 'desc' },
  { id: 'desc' },
];

type SummaryRow = Prisma.SaleGetPayload<{ select: typeof SUMMARY_SELECT }>;
type DetailRow = Prisma.SaleGetPayload<{ select: typeof DETAIL_SELECT }>;

export const toSummary = (row: SummaryRow): SaleSummary => ({
  id: row.id,
  status: row.status,
  total: row.total.toNumber(),
  itemCount: row._count.items,
  createdAt: row.createdAt,
  createdBy: row.createdBy,
});

export const toSale = (row: DetailRow): Sale => ({
  ...toSummary(row),
  paymentMethod: row.paymentMethod,
  completedAt: row.completedAt,
  cancelledAt: row.cancelledAt,
  items: row.items.map((item) => ({
    bookId: item.bookId,
    title: item.book.title,
    quantity: item.quantity,
    unitPrice: item.unitPrice.toNumber(),
  })),
});
