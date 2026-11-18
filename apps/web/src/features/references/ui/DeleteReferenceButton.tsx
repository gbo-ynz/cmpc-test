import { useState } from 'react';
import { Button } from '../../../shared/ui/Button';
import { IconButton } from '../../../shared/ui/IconButton';
import { TrashIcon } from '../../../shared/ui/icons';
import { referenceErrorText, useDeleteReference } from '../application/reference-hooks';
import type { Reference, ReferenceKind } from '../domain/reference.types';

const IN_USE = 'No se puede eliminar: tiene libros asociados.';

/** Two-step inline confirmation, like deleting a book. */
export function DeleteReferenceButton({
  kind,
  reference,
}: {
  kind: ReferenceKind;
  reference: Reference;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const remove = useDeleteReference(kind);

  if (!isConfirming) {
    return (
      <IconButton
        label={`Eliminar ${reference.name}`}
        tone="danger"
        onClick={() => setIsConfirming(true)}
      >
        <TrashIcon />
      </IconButton>
    );
  }

  return (
    <span
      className="confirm"
      role="group"
      aria-label={`Confirmar eliminación de ${reference.name}`}
    >
      <Button
        variant="danger"
        onClick={() => remove.mutate(reference.id)}
        isLoading={remove.isPending}
      >
        Sí, eliminar
      </Button>
      <Button variant="ghost" onClick={() => setIsConfirming(false)} disabled={remove.isPending}>
        Cancelar
      </Button>
      {remove.isError ? (
        <span role="alert" className="field__error">
          {referenceErrorText(remove.error, IN_USE)}
        </span>
      ) : null}
    </span>
  );
}
