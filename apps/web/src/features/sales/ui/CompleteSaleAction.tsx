import { useState } from 'react';
import { errorText } from '../../../shared/api/api-error';
import { Button } from '../../../shared/ui/Button';
import { IconButton } from '../../../shared/ui/IconButton';
import { Modal } from '../../../shared/ui/Modal';
import { SelectField } from '../../../shared/ui/SelectField';
import { CheckIcon } from '../../../shared/ui/icons';
import { useCompleteSale } from '../application/sale-hooks';
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod } from '../domain/sale.types';
import { CANNOT_COMPLETE, NOT_PENDING } from './sale-copy';

/** Row action: the check opens a popup to choose the payment method and accept. */
export function CompleteSaleAction({ saleId, label }: { saleId: string; label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const complete = useCompleteSale(saleId);
  const close = () => setIsOpen(false);

  return (
    <>
      <IconButton label={label} tone="primary" onClick={() => setIsOpen(true)}>
        <CheckIcon />
      </IconButton>
      {isOpen ? (
        <Modal title="Completar venta" onClose={close}>
          <p className="muted">
            Seleccione el método de pago. Al aceptar se descuenta el stock de cada libro.
          </p>
          <SelectField
            label="Método de pago"
            placeholder="Seleccione un método"
            value={method}
            options={PAYMENT_METHOD_OPTIONS}
            onValueChange={(value) => setMethod(value as PaymentMethod | '')}
          />
          {complete.isError ? (
            <p role="alert" className="field__error">
              {errorText(complete.error, { CONFLICT: CANNOT_COMPLETE, NOT_FOUND: NOT_PENDING })}
            </p>
          ) : null}
          <div className="modal__actions">
            <Button variant="ghost" onClick={close} disabled={complete.isPending}>
              Volver
            </Button>
            <Button
              variant="primary"
              disabled={method === ''}
              isLoading={complete.isPending}
              onClick={() => method !== '' && complete.mutate(method, { onSuccess: close })}
            >
              Aceptar
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
