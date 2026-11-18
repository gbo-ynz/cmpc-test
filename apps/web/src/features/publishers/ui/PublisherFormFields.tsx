import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { TextField } from '../../../shared/ui/TextField';
import { COUNTRY_MAX_LENGTH, type PublisherFormValues } from '../domain/publisher-form.schema';

interface PublisherFormFieldsProps {
  register: UseFormRegister<PublisherFormValues>;
  errors: FieldErrors<PublisherFormValues>;
}

/** Name is required; the country is optional (not always known). */
export function PublisherFormFields({ register, errors }: PublisherFormFieldsProps) {
  return (
    <div className="catalog-form__row">
      <TextField label="Nombre" {...register('name')} error={errors.name?.message} />
      <TextField
        label="País"
        hint="Opcional"
        maxLength={COUNTRY_MAX_LENGTH}
        {...register('country')}
        error={errors.country?.message}
      />
    </div>
  );
}
