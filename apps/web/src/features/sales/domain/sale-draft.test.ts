import {
  addToDraft,
  draftTotal,
  removeLine,
  setQuantity,
  toSaleInput,
  type DraftLine,
} from './sale-draft';

const RAYUELA = { id: 'b1', title: 'Rayuela', price: 16990, stock: 3 };
const FICCIONES = { id: 'b2', title: 'Ficciones', price: 9990, stock: 1 };

describe('sale draft', () => {
  it('adds a book once and adds one more unit when it is picked again, up to the stock', () => {
    let lines: DraftLine[] = addToDraft([], RAYUELA);
    lines = addToDraft(lines, RAYUELA);
    lines = addToDraft(addToDraft(lines, RAYUELA), RAYUELA);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ bookId: 'b1', unitPrice: 16990, stock: 3, quantity: 3 });
  });

  it('keeps the quantity between 1 and the stock', () => {
    const lines = addToDraft([], RAYUELA);

    expect(setQuantity(lines, 'b1', 99)[0].quantity).toBe(3);
    expect(setQuantity(lines, 'b1', 0)[0].quantity).toBe(1);
    expect(setQuantity(lines, 'b1', -4)[0].quantity).toBe(1);
    expect(setQuantity(lines, 'b1', 2.9)[0].quantity).toBe(2);
    expect(setQuantity(lines, 'b1', Number.NaN)[0].quantity).toBe(1);
  });

  it('removes a line and does not mutate the previous list', () => {
    const lines = addToDraft(addToDraft([], RAYUELA), FICCIONES);

    expect(removeLine(lines, 'b1').map((line) => line.bookId)).toEqual(['b2']);
    expect(lines).toHaveLength(2);
  });

  it('adds the total in whole pesos and sends only book and quantity', () => {
    const lines = setQuantity(addToDraft(addToDraft([], RAYUELA), FICCIONES), 'b1', 3);

    expect(draftTotal(lines)).toBe(60960);
    expect(draftTotal([])).toBe(0);
    expect(toSaleInput(lines)).toEqual([
      { bookId: 'b1', quantity: 3 },
      { bookId: 'b2', quantity: 1 },
    ]);
  });
});
