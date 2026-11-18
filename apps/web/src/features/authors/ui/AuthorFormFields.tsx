import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { TextAreaField } from '../../../shared/ui/TextAreaField';
import { TextField } from '../../../shared/ui/TextField';
import {
  BIOGRAPHY_MAX_LENGTH,
  localToday,
  type AuthorFormValues,
} from '../domain/author-form.schema';

interface AuthorFormFieldsProps {
  register: UseFormRegister<AuthorFormValues>;
  errors: FieldErrors<AuthorFormValues>;
  biographyLength: number;
}

/** Name is required; birth date and biography are optional (not always known). */
export function AuthorFormFields({ register, errors, biographyLength }: AuthorFormFieldsProps) {
  return (
    <>
      <div className="catalog-form__row">
        <TextField label="Nombre" {...register('name')} error={errors.name?.message} />
        <TextField
          label="Fecha de nacimiento"
          type="date"
          max={localToday()}
          hint="Opcional"
          {...register('birthDate')}
          error={errors.birthDate?.message}
        />
      </div>
      <TextAreaField
        label="Biografía"
        rows={3}
        hint={`Opcional · ${biographyLength}/${BIOGRAPHY_MAX_LENGTH} caracteres`}
        {...register('biography')}
        error={errors.biography?.message}
      />
    </>
  );
}
