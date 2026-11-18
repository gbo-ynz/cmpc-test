import { useId, type ComponentPropsWithRef } from 'react';

interface CheckboxFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  label: string;
}

export function CheckboxField({ label, id, ...inputProps }: CheckboxFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="field field--inline">
      <input id={inputId} type="checkbox" className="field__checkbox" {...inputProps} />
      <label htmlFor={inputId} className="field__label">
        {label}
      </label>
    </div>
  );
}
