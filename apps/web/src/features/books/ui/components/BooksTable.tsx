import { EmptyState } from '../../../../shared/ui/EmptyState';
import { Spinner } from '../../../../shared/ui/Spinner';
import type { Book, SortField, SortRule } from '../../domain/book.types';
import { BookRow } from './BookRow';
import { SortableHeader } from './SortableHeader';

const COLUMNS: ReadonlyArray<{ field: SortField; label: string }> = [
  { field: 'title', label: 'Título' },
  { field: 'author', label: 'Autor' },
  { field: 'publisher', label: 'Editorial' },
  { field: 'genre', label: 'Género' },
  { field: 'price', label: 'Precio' },
  { field: 'isAvailable', label: 'Estado' },
];

interface BooksTableProps {
  books: Book[];
  sort: readonly SortRule[];
  onSort: (field: SortField) => void;
  isLoading: boolean;
  isRefreshing: boolean;
}

export function BooksTable({ books, sort, onSort, isLoading, isRefreshing }: BooksTableProps) {
  if (isLoading) {
    return (
      <div className="table-placeholder">
        <Spinner label="Cargando libros" />
      </div>
    );
  }
  if (books.length === 0) {
    return (
      <EmptyState
        title="No se encontraron libros"
        description="Ajuste los filtros o agregue un libro nuevo."
      />
    );
  }
  return (
    <div
      className={`table-wrapper card${isRefreshing ? ' is-refreshing' : ''}`}
      aria-busy={isRefreshing}
    >
      <table className="table">
        <caption className="sr-only">
          Libros. Haga clic en un encabezado para ordenar; haga clic de nuevo para invertir el
          orden.
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Portada</span>
            </th>
            {COLUMNS.map(({ field, label }) => (
              <SortableHeader key={field} field={field} label={label} sort={sort} onSort={onSort} />
            ))}
            <th scope="col">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
