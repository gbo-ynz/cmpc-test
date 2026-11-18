import { useState } from 'react';
import { referenceErrorText, useRenameReference } from '../application/reference-hooks';
import { REFERENCE_COPY, type Reference, type ReferenceKind } from '../domain/reference.types';
import { ActiveBooksPill, ReferenceName } from './ReferenceCells';
import { ReferenceRowActions } from './ReferenceRowActions';

/** One catalog record: shows its name, or an inline input while it is being renamed. */
export function ReferenceRow({ kind, reference }: { kind: ReferenceKind; reference: Reference }) {
  const [draft, setDraft] = useState<string | null>(null);
  const rename = useRenameReference(kind);
  const name = draft?.trim() ?? '';
  const save = () => rename.mutate({ id: reference.id, name }, { onSuccess: () => setDraft(null) });

  return (
    <tr>
      <td>
        {draft === null ? (
          <ReferenceName name={reference.name} />
        ) : (
          <input
            className="field__control"
            aria-label={`Nuevo nombre de ${reference.name}`}
            value={draft}
            maxLength={REFERENCE_COPY[kind].maxLength}
            onChange={(event) => setDraft(event.target.value)}
          />
        )}
        {rename.isError ? (
          <p role="alert" className="field__error">
            {referenceErrorText(rename.error, REFERENCE_COPY[kind].nameTaken)}
          </p>
        ) : null}
      </td>
      <td className="table__center">
        <ActiveBooksPill count={reference.activeBooks} />
      </td>
      <td className="table__actions">
        <ReferenceRowActions
          kind={kind}
          reference={reference}
          isEditing={draft !== null}
          canSave={name.length > 0}
          isSaving={rename.isPending}
          onEdit={() => setDraft(reference.name)}
          onSave={save}
          onCancel={() => setDraft(null)}
        />
      </td>
    </tr>
  );
}
