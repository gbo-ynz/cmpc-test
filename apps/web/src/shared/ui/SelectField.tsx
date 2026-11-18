import { useId, type ComponentPropsWithRef } from 'react';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SelectFieldProps extends Omit<ComponentPropsWithRef<'select'>, 'onChange'> {
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  onValueChange: (value: string) => void;
}

export function SelectField({
  label,
  options,
  placeholder,
  onValueChange,
  ...rest
}: SelectFieldProps) {
  const id = useId();

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <select
        id={id}
        className="field__control"
        onChange={(event) => onValueChange(event.target.value)}
        {...rest}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
