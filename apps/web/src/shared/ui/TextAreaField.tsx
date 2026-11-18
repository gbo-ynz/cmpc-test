import { useId, type ComponentPropsWithRef } from 'react';

interface TextAreaFieldProps extends ComponentPropsWithRef<'textarea'> {
  label: string;
  error?: string;
  hint?: string;
}

/** Multi-line twin of TextField: same label, error and hint wiring. */
export function TextAreaField({ label, error, hint, id, ...textareaProps }: TextAreaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className="field">
      <label htmlFor={inputId} className="field__label">
        {label}
      </label>
      <textarea
        id={inputId}
        className={`field__control field__control--textarea${error ? ' field__control--invalid' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        {...textareaProps}
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
