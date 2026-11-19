import { buildSale } from './sale-builder';
import type { SellableBook } from './sale';
import { InvalidSaleError } from './sale.errors';

const RAYUELA: SellableBook = { id: 'b1', title: 'Rayuela', price: 16990, stock: 5 };
const FICCIONES: SellableBook = { id: 'b2', title: 'Ficciones', price: 9990, stock: 2 };

describe('buildSale', () => {
  it('snapshots each unit price and adds the total exactly, in whole pesos', () => {
    const sale = buildSale(
      'u1',
      [
        { bookId: 'b1', quantity: 3 },
        { bookId: 'b2', quantity: 2 },
      ],
      [RAYUELA, FICCIONES],
    );

    expect(sale.items).toEqual([
      { bookId: 'b1', quantity: 3, unitPrice: 16990 },
      { bookId: 'b2', quantity: 2, unitPrice: 9990 },
    ]);
    expect(sale.total).toBe(70950);
    expect(sale.createdById).toBe('u1');
  });

  it('rejects a sale without lines', () => {
    expect(() => buildSale('u1', [], [RAYUELA])).toThrow(InvalidSaleError);
  });

  it('rejects a book repeated in two lines', () => {
    const lines = [
      { bookId: 'b1', quantity: 1 },
      { bookId: 'b1', quantity: 2 },
    ];

    expect(() => buildSale('u1', lines, [RAYUELA])).toThrow('two lines');
  });

  it('rejects books that are not active (not among the sellable ones)', () => {
    expect(() => buildSale('u1', [{ bookId: 'gone', quantity: 1 }], [RAYUELA])).toThrow(
      'not available',
    );
  });

  it('rejects a quantity above the current stock or below one', () => {
    expect(() => buildSale('u1', [{ bookId: 'b2', quantity: 3 }], [FICCIONES])).toThrow(
      'Only 2 unit(s)',
    );
    expect(() => buildSale('u1', [{ bookId: 'b2', quantity: 0 }], [FICCIONES])).toThrow(
      InvalidSaleError,
    );
    expect(() => buildSale('u1', [{ bookId: 'b2', quantity: 1.5 }], [FICCIONES])).toThrow(
      InvalidSaleError,
    );
  });
});
