import { useId, type ComponentPropsWithRef } from 'react';

interface TextFieldProps extends ComponentPropsWithRef<'input'> {
  label: string;
  error?: string;
  hint?: string;
}

/** Accessible input: label, inline error and hint wired through aria attributes. */
export function TextField({
  label,
  error,
  hint,
  id,
  className = '',
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={inputId} className="field__label">
        {label}
      </label>
      <input
        id={inputId}
        className={`field__control${error ? ' field__control--invalid' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        {...inputProps}
      />
      {message ? (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={error ? 'field__error' : 'field__hint'}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
