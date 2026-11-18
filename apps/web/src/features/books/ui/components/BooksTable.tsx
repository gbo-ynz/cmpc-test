import { EmptyState } from '../../../../shared/ui/EmptyState';
import { Spinner } from '../../../../shared/ui/Spinner';
import type { Book, SortField, SortRule } from '../../domain/book.types';
import { BookRow } from './BookRow';
import { BooksTableHead } from './BooksTableHead';

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
        <BooksTableHead sort={sort} onSort={onSort} />
        <tbody>
          {books.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
