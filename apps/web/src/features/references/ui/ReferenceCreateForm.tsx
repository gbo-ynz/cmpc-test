import { useState, type FormEvent } from 'react';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { referenceErrorText, useCreateReference } from '../application/reference-hooks';
import { REFERENCE_COPY, type ReferenceKind } from '../domain/reference.types';

export function ReferenceCreateForm({ kind }: { kind: ReferenceKind }) {
  const copy = REFERENCE_COPY[kind];
  const [name, setName] = useState('');
  const create = useCreateReference(kind);
  const trimmed = name.trim();
  const isTooLong = trimmed.length > copy.maxLength;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(trimmed, { onSuccess: () => setName('') });
  };

  return (
    <form className="reference-form card" onSubmit={submit} noValidate>
      <TextField
        label={copy.newLabel}
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={isTooLong ? `Máximo ${copy.maxLength} caracteres` : undefined}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={!trimmed || isTooLong}
        isLoading={create.isPending}
      >
        Agregar
      </Button>
      {create.isError ? (
        <p role="alert" className="field__error">
          {referenceErrorText(create.error, copy.nameTaken)}
        </p>
      ) : null}
    </form>
  );
}
