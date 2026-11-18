import type { PageMeta } from '../api/envelope';
import { Button } from './Button';
import { SelectField } from './SelectField';

const PAGE_SIZES = [10, 20, 50].map((size) => ({ value: String(size), label: String(size) }));

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({ meta, onPageChange, onLimitChange }: PaginationProps) {
  const totalPages = Math.max(meta.totalPages, 1);

  return (
    <nav className="pagination" aria-label="Paginación">
      <span className="muted">
        Página {meta.page} de {totalPages} · {meta.total} resultados
      </span>
      <div className="pagination__controls">
        <SelectField
          label="Por página"
          value={String(meta.limit)}
          options={PAGE_SIZES}
          onValueChange={(value) => onLimitChange(Number(value))}
        />
        <Button onClick={() => onPageChange(meta.page - 1)} disabled={meta.page <= 1}>
          Anterior
        </Button>
        <Button onClick={() => onPageChange(meta.page + 1)} disabled={meta.page >= totalPages}>
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
