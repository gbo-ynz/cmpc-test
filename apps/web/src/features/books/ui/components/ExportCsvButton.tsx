import { toApiError } from '../../../../shared/api/api-error';
import { Button } from '../../../../shared/ui/Button';
import { useExportCsv } from '../../application/book-mutations';
import type { BookFilters, SortRule } from '../../domain/book.types';

interface ExportCsvButtonProps {
  filters: BookFilters;
  sort: readonly SortRule[];
}

/** Exports exactly what the user is looking at (same filters and order). */
export function ExportCsvButton({ filters, sort }: ExportCsvButtonProps) {
  const exportCsv = useExportCsv();

  return (
    <div className="export">
      <Button onClick={() => exportCsv.mutate({ filters, sort })} isLoading={exportCsv.isPending}>
        Exportar CSV
      </Button>
      {exportCsv.isError ? (
        <span role="alert" className="field__error">
          {toApiError(exportCsv.error).message}
        </span>
      ) : null}
    </div>
  );
}
