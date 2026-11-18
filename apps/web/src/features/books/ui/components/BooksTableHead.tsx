import type { SortField, SortRule } from '../../domain/book.types';
import { SortableHeader } from './SortableHeader';

const COLUMNS: ReadonlyArray<{ field: SortField; label: string }> = [
  { field: 'title', label: 'Título' },
  { field: 'author', label: 'Autor' },
  { field: 'publisher', label: 'Editorial' },
  { field: 'genre', label: 'Género' },
  { field: 'price', label: 'Precio' },
  { field: 'stock', label: 'Stock' },
];

interface BooksTableHeadProps {
  sort: readonly SortRule[];
  onSort: (field: SortField) => void;
}

/** Accessible caption plus the sortable column headers of the inventory table. */
export function BooksTableHead({ sort, onSort }: BooksTableHeadProps) {
  return (
    <>
      <caption className="sr-only">
        Libros. Haga clic en un encabezado para ordenar; haga clic de nuevo para invertir el orden.
      </caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="sr-only">Portada</span>
          </th>
          {COLUMNS.map(({ field, label }) => (
            <SortableHeader key={field} field={field} label={label} sort={sort} onSort={onSort} />
          ))}
          <th scope="col">Estado</th>
          <th scope="col">
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
    </>
  );
}
