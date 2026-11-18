import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../../shared/ui/Button';
import {
  EMPTY_AUTHOR_FORM,
  authorFormSchema,
  toAuthorInput,
  type AuthorFormValues,
} from '../domain/author-form.schema';
import type { AuthorInput } from '../domain/author.types';
import { AuthorFormFields } from './AuthorFormFields';

interface AuthorFormProps {
  defaultValues?: AuthorFormValues;
  submitLabel: string;
  /** Resolves true when saved: the form then keeps the saved values as its new baseline. */
  onSubmit: (input: AuthorInput) => Promise<boolean>;
}

/** Reactive validation (mode "onChange"), like the book form. */
export function AuthorForm(props: AuthorFormProps) {
  const { defaultValues = EMPTY_AUTHOR_FORM, submitLabel, onSubmit } = props;
  const { register, handleSubmit, reset, watch, formState } = useForm<AuthorFormValues>({
    resolver: zodResolver(authorFormSchema),
    mode: 'onChange',
    defaultValues,
  });
  const { errors, isValid, isDirty, isSubmitting } = formState;
  const submit = handleSubmit(async (values) => {
    if (await onSubmit(toAuthorInput(values))) reset(values);
  });

  return (
    <form className="catalog-form" noValidate onSubmit={submit}>
      <AuthorFormFields
        register={register}
        errors={errors}
        biographyLength={watch('biography').length}
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
