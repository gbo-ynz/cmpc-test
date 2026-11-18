import { useState } from 'react';
import { errorText } from '../../../shared/api/api-error';
import { Button } from '../../../shared/ui/Button';
import { IconButton } from '../../../shared/ui/IconButton';
import { TicketIcon } from '../../../shared/ui/sale-icons';
import { useCompleteSale } from '../application/sale-hooks';
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod } from '../domain/sale.types';
import { CANNOT_COMPLETE, NOT_PENDING } from './sale-copy';

/** Row action: the ticket opens an inline payment method choice, so the list stays in view. */
export function CompleteSaleAction({ saleId, label }: { saleId: string; label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const complete = useCompleteSale(saleId);

  if (!isOpen) {
    return (
      <IconButton label={label} tone="primary" onClick={() => setIsOpen(true)}>
        <TicketIcon />
      </IconButton>
    );
  }

  return (
    <span className="confirm" role="group" aria-label="Completar venta">
      <select
        className="field__control"
        aria-label="Método de pago"
        value={method}
        onChange={(event) => setMethod(event.target.value as PaymentMethod | '')}
      >
        <option value="">Método de pago…</option>
        {PAYMENT_METHOD_OPTIONS.map(({ value, label: text }) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      <Button
        variant="primary"
        disabled={method === ''}
        isLoading={complete.isPending}
        onClick={() => method !== '' && complete.mutate(method)}
      >
        Completar
      </Button>
      <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={complete.isPending}>
        Volver
      </Button>
      {complete.isError ? (
        <span role="alert" className="field__error">
          {errorText(complete.error, { CONFLICT: CANNOT_COMPLETE, NOT_FOUND: NOT_PENDING })}
        </span>
      ) : null}
    </span>
  );
}
