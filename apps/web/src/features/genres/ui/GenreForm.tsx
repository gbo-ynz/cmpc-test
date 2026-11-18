import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../../shared/ui/Button';
import {
  EMPTY_GENRE_FORM,
  genreFormSchema,
  toGenreInput,
  type GenreFormValues,
} from '../domain/genre-form.schema';
import type { GenreInput } from '../domain/genre.types';
import { GenreFormFields } from './GenreFormFields';

interface GenreFormProps {
  defaultValues?: GenreFormValues;
  submitLabel: string;
  /** Resolves true when saved: the form then keeps the saved values as its new baseline. */
  onSubmit: (input: GenreInput) => Promise<boolean>;
}

/** Reactive validation (mode "onChange"), like the book, author and publisher forms. */
export function GenreForm(props: GenreFormProps) {
  const { defaultValues = EMPTY_GENRE_FORM, submitLabel, onSubmit } = props;
  const { register, handleSubmit, reset, watch, formState } = useForm<GenreFormValues>({
    resolver: zodResolver(genreFormSchema),
    mode: 'onChange',
    defaultValues,
  });
  const { errors, isValid, isDirty, isSubmitting } = formState;
  const submit = handleSubmit(async (values) => {
    if (await onSubmit(toGenreInput(values))) reset(values);
  });

  return (
    <form className="catalog-form" noValidate onSubmit={submit}>
      <GenreFormFields
        register={register}
        errors={errors}
        descriptionLength={watch('description').length}
      />
      <div className="form__actions">
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || !isDirty}
          isLoading={isSubmitting}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
