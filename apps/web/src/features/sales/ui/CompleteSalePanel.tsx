import { useState } from 'react';
import { errorText } from '../../../shared/api/api-error';
import { Button } from '../../../shared/ui/Button';
import { SelectField } from '../../../shared/ui/SelectField';
import { useCompleteSale } from '../application/sale-hooks';
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod } from '../domain/sale.types';
import { CANNOT_COMPLETE, NOT_PENDING } from './sale-copy';

/** Completing needs a payment method; it discounts the stock of every line (RF-17). */
export function CompleteSalePanel({ saleId }: { saleId: string }) {
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const complete = useCompleteSale(saleId);

  return (
    <div className="card panel complete-panel">
      <SelectField
        label="Método de pago"
        placeholder="Seleccione un método"
        value={method}
        options={PAYMENT_METHOD_OPTIONS}
        onValueChange={(value) => setMethod(value as PaymentMethod | '')}
      />
      <Button
        variant="primary"
        disabled={method === ''}
        isLoading={complete.isPending}
        onClick={() => method !== '' && complete.mutate(method)}
      >
        Completar venta
      </Button>
      {complete.isError ? (
        <p role="alert" className="field__error">
          {errorText(complete.error, { CONFLICT: CANNOT_COMPLETE, NOT_FOUND: NOT_PENDING })}
        </p>
      ) : null}
    </div>
  );
}
