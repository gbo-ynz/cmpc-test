import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormActions } from '../../../../shared/ui/FormActions';
import { useCatalog } from '../../application/book-queries';
import {
  EMPTY_BOOK_FORM,
  bookFormSchema,
  type BookFormValues,
} from '../../domain/book-form.schema';
import { BookFormFields } from './BookFormFields';
import { ImagePicker } from './ImagePicker';

interface BookFormProps {
  defaultValues?: BookFormValues;
  currentImageUrl?: string | null;
  submitLabel: string;
  onSubmit: (values: BookFormValues, image: File | null) => Promise<void>;
}

/** Reactive validation: errors appear while typing (mode "onChange"). */
export function BookForm({
  defaultValues = EMPTY_BOOK_FORM,
  currentImageUrl = null,
  submitLabel,
  onSubmit,
}: BookFormProps) {
  const [image, setImage] = useState<File | null>(null);
  const { data: catalog } = useCatalog();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    mode: 'onChange',
    defaultValues,
  });

  const hasChanges = isDirty || image !== null;

  return (
    <form
      className="form card"
      noValidate
      onSubmit={handleSubmit((values) => onSubmit(values, image))}
    >
      <BookFormFields register={register} errors={errors} catalog={catalog} />
      <ImagePicker currentUrl={currentImageUrl} onChange={setImage} />
      <FormActions
        cancelTo="/books"
        submitLabel={submitLabel}
        isDisabled={!isValid || !hasChanges}
        isLoading={isSubmitting}
      />
    </form>
  );
}
