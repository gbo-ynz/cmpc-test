import { toApiError } from '../../../shared/api/api-error';
import { Button } from '../../../shared/ui/Button';
import { useExportReferences } from '../application/reference-hooks';
import type { ReferenceKind } from '../domain/reference.types';

/** Exports the whole catalog (every record, sorted by name), not just the visible page. */
export function ExportReferencesButton({ kind }: { kind: ReferenceKind }) {
  const exportCsv = useExportReferences(kind);

  return (
    <div className="export">
      <Button onClick={() => exportCsv.mutate()} isLoading={exportCsv.isPending}>
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
