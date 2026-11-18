import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { TextAreaField } from '../../../shared/ui/TextAreaField';
import { TextField } from '../../../shared/ui/TextField';
import { DESCRIPTION_MAX_LENGTH, type GenreFormValues } from '../domain/genre-form.schema';

interface GenreFormFieldsProps {
  register: UseFormRegister<GenreFormValues>;
  errors: FieldErrors<GenreFormValues>;
  descriptionLength: number;
}

/** Name is required; the description is optional free text. */
export function GenreFormFields({ register, errors, descriptionLength }: GenreFormFieldsProps) {
  return (
    <>
      <TextField label="Nombre" {...register('name')} error={errors.name?.message} />
      <TextAreaField
        label="Descripción"
        rows={3}
        hint={`Opcional · ${descriptionLength}/${DESCRIPTION_MAX_LENGTH} caracteres`}
        {...register('description')}
        error={errors.description?.message}
      />
    </>
  );
}
