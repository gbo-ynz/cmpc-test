import { useState } from 'react';
import { errorText } from '../../../shared/api/api-error';
import { Button } from '../../../shared/ui/Button';
import { useCancelSale } from '../application/sale-hooks';
import { NOT_PENDING } from './sale-copy';

/** Two-step inline confirmation: cancelling is final, but it never touches the stock. */
export function CancelSaleButton({ saleId }: { saleId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const cancel = useCancelSale(saleId);

  if (!isConfirming) {
    return (
      <Button variant="danger" onClick={() => setIsConfirming(true)}>
        Cancelar venta
      </Button>
    );
  }

  return (
    <span className="confirm" role="group" aria-label="Confirmar cancelación de la venta">
      <Button
        variant="danger"
        onClick={() => cancel.mutate(undefined)}
        isLoading={cancel.isPending}
      >
        Sí, cancelar
      </Button>
      <Button variant="ghost" onClick={() => setIsConfirming(false)} disabled={cancel.isPending}>
        Volver
      </Button>
      {cancel.isError ? (
        <span role="alert" className="field__error">
          {errorText(cancel.error, { CONFLICT: NOT_PENDING })}
        </span>
      ) : null}
    </span>
  );
}
