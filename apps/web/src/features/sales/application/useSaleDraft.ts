import { useState } from 'react';
import {
  addToDraft,
  removeLine,
  setQuantity,
  type DraftLine,
  type PickedBook,
} from '../domain/sale-draft';

/** The lines being built in the "new sale" form (nothing is sent until the sale is created). */
export function useSaleDraft() {
  const [lines, setLines] = useState<readonly DraftLine[]>([]);

  return {
    lines,
    add: (book: PickedBook) => setLines((current) => addToDraft(current, book)),
    changeQuantity: (bookId: string, quantity: number) =>
      setLines((current) => setQuantity(current, bookId, quantity)),
    remove: (bookId: string) => setLines((current) => removeLine(current, bookId)),
  };
}
