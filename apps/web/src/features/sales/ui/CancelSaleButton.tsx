import { useState } from 'react';
import { errorText } from '../../../shared/api/api-error';
import { Button } from '../../../shared/ui/Button';
import { IconButton } from '../../../shared/ui/IconButton';
import { CloseIcon } from '../../../shared/ui/icons';
import { useCancelSale } from '../application/sale-hooks';
import { NOT_PENDING } from './sale-copy';

interface CancelSaleButtonProps {
  saleId: string;
  /** Icon-only trigger for table rows; `label` then names the sale for screen readers. */
  compact?: boolean;
  label?: string;
}

/** Two-step inline confirmation: cancelling is final, but it never touches the stock. */
export function CancelSaleButton({
  saleId,
  compact = false,
  label = 'Cancelar venta',
}: CancelSaleButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const cancel = useCancelSale(saleId);

  if (!isConfirming) {
    const open = () => setIsConfirming(true);
    return compact ? (
      <IconButton label={label} tone="danger" onClick={open}>
        <CloseIcon />
      </IconButton>
    ) : (
      <Button variant="danger" onClick={open}>
        {label}
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
