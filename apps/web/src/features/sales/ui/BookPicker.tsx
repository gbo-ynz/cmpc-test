import { useState } from 'react';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { formatPrice } from '../../../shared/lib/format';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { INITIAL_FILTERS } from '../../books/application/useBookListState';
import { useBookList } from '../../books/application/book-queries';
import type { Book, SortRule } from '../../books/domain/book.types';

const SEARCH_DELAY_MS = 300;
const RESULTS = 8;
const BY_TITLE: SortRule[] = [{ field: 'title', direction: 'asc' }];

/** Searches only books that can be sold (available), a few at a time. */
export function BookPicker({ onPick }: { onPick: (book: Book) => void }) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const filters = { ...INITIAL_FILTERS, search: debounced, availability: 'true' } as const;
  const { data } = useBookList({ filters, sort: BY_TITLE, page: 1, limit: RESULTS });

  return (
    <div className="card panel book-picker">
      <TextField
        label="Buscar libro"
        placeholder="Título, autor o editorial"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <ul className="book-picker__results" aria-label="Libros disponibles">
        {data?.items.map((book) => (
          <li key={book.id}>
            <span>
              <strong>{book.title}</strong> · {book.author}
              <span className="muted">
                {' '}
                · {formatPrice(book.price)} · {book.stock} en stock
              </span>
            </span>
            <Button
              variant="ghost"
              onClick={() => onPick(book)}
              aria-label={`Agregar ${book.title}`}
            >
              Agregar
            </Button>
          </li>
        ))}
      </ul>
      {data && data.items.length === 0 ? <p className="muted">No hay libros disponibles.</p> : null}
    </div>
  );
}
