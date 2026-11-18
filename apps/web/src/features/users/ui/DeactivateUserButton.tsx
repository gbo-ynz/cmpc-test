import { useState } from 'react';
import { Button } from '../../../shared/ui/Button';
import { IconButton } from '../../../shared/ui/IconButton';
import { TrashIcon } from '../../../shared/ui/icons';
import { useDeactivateUser, userErrorText } from '../application/user-hooks';
import type { ManagedUser } from '../domain/user.types';
import { CANNOT_DELETE } from './user-copy';

/** Two-step inline confirmation, like deleting a book. */
export function DeactivateUserButton({ user }: { user: ManagedUser }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const remove = useDeactivateUser();

  if (!isConfirming) {
    return (
      <IconButton
        label={`Eliminar ${user.name}`}
        tone="danger"
        onClick={() => setIsConfirming(true)}
      >
        <TrashIcon />
      </IconButton>
    );
  }

  return (
    <span className="confirm" role="group" aria-label={`Confirmar eliminación de ${user.name}`}>
      <Button variant="danger" onClick={() => remove.mutate(user.id)} isLoading={remove.isPending}>
        Sí, eliminar
      </Button>
      <Button variant="ghost" onClick={() => setIsConfirming(false)} disabled={remove.isPending}>
        Cancelar
      </Button>
      {remove.isError ? (
        <span role="alert" className="field__error">
          {userErrorText(remove.error, CANNOT_DELETE)}
        </span>
      ) : null}
    </span>
  );
}
