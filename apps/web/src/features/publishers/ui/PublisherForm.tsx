import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../../shared/ui/Button';
import {
  EMPTY_PUBLISHER_FORM,
  publisherFormSchema,
  toPublisherInput,
  type PublisherFormValues,
} from '../domain/publisher-form.schema';
import type { PublisherInput } from '../domain/publisher.types';
import { PublisherFormFields } from './PublisherFormFields';

interface PublisherFormProps {
  defaultValues?: PublisherFormValues;
  submitLabel: string;
  /** Resolves true when saved: the form then keeps the saved values as its new baseline. */
  onSubmit: (input: PublisherInput) => Promise<boolean>;
}

/** Reactive validation (mode "onChange"), like the book and author forms. */
export function PublisherForm(props: PublisherFormProps) {
  const { defaultValues = EMPTY_PUBLISHER_FORM, submitLabel, onSubmit } = props;
  const { register, handleSubmit, reset, formState } = useForm<PublisherFormValues>({
    resolver: zodResolver(publisherFormSchema),
    mode: 'onChange',
    defaultValues,
  });
  const { errors, isValid, isDirty, isSubmitting } = formState;
  const submit = handleSubmit(async (values) => {
    if (await onSubmit(toPublisherInput(values))) reset(values);
  });

  return (
    <form className="catalog-form" noValidate onSubmit={submit}>
      <PublisherFormFields register={register} errors={errors} />
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
