import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { FormSelect } from '../../../../shared/ui/FormSelect';
import { TextField } from '../../../../shared/ui/TextField';
import type { BookFormOptions } from '../../application/book-form-options';
import type { BookFormValues } from '../../domain/book-form.schema';

interface BookFormFieldsProps {
  register: UseFormRegister<BookFormValues>;
  errors: FieldErrors<BookFormValues>;
  options: BookFormOptions;
}

// Catalog fields: picked from the admin-managed lists, never typed.
const CATALOG_FIELDS = [
  { name: 'authorId', label: 'Autor', placeholder: 'Seleccione un autor', options: 'authors' },
  {
    name: 'publisherId',
    label: 'Editorial',
    placeholder: 'Seleccione una editorial',
    options: 'publishers',
  },
  { name: 'genreId', label: 'Género', placeholder: 'Seleccione un género', options: 'genres' },
] as const;

export function BookFormFields({ register, errors, options }: BookFormFieldsProps) {
  return (
    <div className="form__grid">
      <TextField label="Título" error={errors.title?.message} {...register('title')} />
      {CATALOG_FIELDS.map((field) => (
        <FormSelect
          key={field.name}
          label={field.label}
          placeholder={field.placeholder}
          options={options[field.options]}
          error={errors[field.name]?.message}
          {...register(field.name)}
        />
      ))}
      <TextField
        label="Precio (CLP)"
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        error={errors.price?.message}
        {...register('price', { valueAsNumber: true })}
      />
      <TextField
        label="Stock (unidades)"
        type="number"
        step="1"
        min="0"
        inputMode="numeric"
        error={errors.stock?.message}
        {...register('stock', { valueAsNumber: true })}
      />
    </div>
  );
}
