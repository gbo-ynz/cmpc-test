import type { SortField, SortRule } from '../../domain/book.types';
import { sortState } from '../../domain/sort';

interface SortableHeaderProps {
  field: SortField;
  label: string;
  sort: readonly SortRule[];
  onSort: (field: SortField) => void;
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

export function SortableHeader({ field, label, sort, onSort }: SortableHeaderProps) {
  const state = sortState(sort, field);
  const showPriority = state !== null && sort.length > 1;

  return (
    <th scope="col" aria-sort={state ? ARIA_SORT[state.direction] : 'none'}>
      <button type="button" className="sort-button" onClick={() => onSort(field)}>
        {label}
        {state ? (
          <span className="sort-button__indicator" aria-hidden="true">
            {state.direction === 'asc' ? '▲' : '▼'}
            {showPriority ? state.priority : null}
          </span>
        ) : null}
      </button>
    </th>
  );
}
