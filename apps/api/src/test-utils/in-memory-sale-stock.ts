import { randomUUID } from 'node:crypto';
import type { SellableBook } from '../modules/sales/domain/sale';
import { SaleStock } from '../modules/sales/domain/sale-stock';

/** Same contract as the Prisma adapter: deleted books are invisible and stock never goes negative. */
export class InMemorySaleStock extends SaleStock {
  private readonly books = new Map<string, SellableBook & { deleted: boolean }>();

  seed(overrides: Partial<SellableBook> & { deleted?: boolean } = {}): SellableBook {
    const book = {
      id: randomUUID(),
      title: 'Rayuela',
      price: 1000,
      stock: 5,
      deleted: false,
      ...overrides,
    };
    this.books.set(book.id, book);
    return book;
  }

  stockOf(id: string): number | undefined {
    return this.books.get(id)?.stock;
  }

  titleOf(id: string): string {
    return this.books.get(id)?.title ?? '';
  }

  async findSellable(ids: readonly string[]): Promise<SellableBook[]> {
    return ids.flatMap((id) => {
      const book = this.books.get(id);
      return book && !book.deleted ? [book] : [];
    });
  }

  async decrement(bookId: string, quantity: number): Promise<boolean> {
    const book = this.books.get(bookId);
    if (!book || book.deleted || book.stock < quantity) return false;
    this.books.set(bookId, { ...book, stock: book.stock - quantity });
    return true;
  }
}
