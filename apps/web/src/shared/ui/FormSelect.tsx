import { useId, type ComponentPropsWithRef } from 'react';
import type { SelectOption } from './SelectField';

interface FormSelectProps extends ComponentPropsWithRef<'select'> {
  label: string;
  options: readonly SelectOption[];
  placeholder: string;
  error?: string;
}

/** Form-bound select (react-hook-form `register`), with the same error wiring as TextField. */
export function FormSelect({
  label,
  options,
  placeholder,
  error,
  id,
  ...selectProps
}: FormSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="field">
      <label htmlFor={selectId} className="field__label">
        {label}
      </label>
      <select
        id={selectId}
        className={`field__control${error ? ' field__control--invalid' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...selectProps}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
