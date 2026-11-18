import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../../shared/ui/Button';
import {
  EMPTY_USER_FORM,
  schemaFor,
  toUserInput,
  type UserFormMode,
  type UserFormValues,
} from '../domain/user-form.schema';
import type { UserInput } from '../domain/user.types';
import { UserFormFields } from './UserFormFields';

interface UserFormProps {
  mode: UserFormMode;
  defaultValues?: UserFormValues;
  submitLabel: string;
  isRoleLocked?: boolean;
  /** Resolves true when saved: the form then keeps the saved values as its new baseline. */
  onSubmit: (input: UserInput) => Promise<boolean>;
}

/** Reactive validation (mode "onChange"), like the other admin forms. */
export function UserForm(props: UserFormProps) {
  const { mode, defaultValues = EMPTY_USER_FORM, submitLabel, onSubmit } = props;
  const { register, handleSubmit, reset, formState } = useForm<UserFormValues>({
    resolver: zodResolver(schemaFor(mode)),
    mode: 'onChange',
    defaultValues,
  });
  const { errors, isValid, isDirty, isSubmitting } = formState;
  const submit = handleSubmit(async (values) => {
    // The password is never kept in the form after saving.
    if (await onSubmit(toUserInput(values))) reset({ ...values, password: '' });
  });

  return (
    <form className="catalog-form" noValidate onSubmit={submit}>
      <UserFormFields
        mode={mode}
        register={register}
        errors={errors}
        isRoleLocked={props.isRoleLocked ?? false}
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
