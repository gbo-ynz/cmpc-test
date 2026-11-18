import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { FormSelect } from '../../../shared/ui/FormSelect';
import { TextField } from '../../../shared/ui/TextField';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  type UserFormMode,
  type UserFormValues,
} from '../domain/user-form.schema';
import { ROLE_LABELS } from '../domain/user.types';

interface UserFormFieldsProps {
  mode: UserFormMode;
  register: UseFormRegister<UserFormValues>;
  errors: FieldErrors<UserFormValues>;
  /** Administrators cannot remove their own profile (the API answers 409). */
  isRoleLocked: boolean;
}

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export function UserFormFields({ mode, register, errors, isRoleLocked }: UserFormFieldsProps) {
  return (
    <>
      <div className="catalog-form__row">
        <TextField label="Nombre" {...register('name')} error={errors.name?.message} />
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="off"
          maxLength={EMAIL_MAX_LENGTH}
          {...register('email')}
          error={errors.email?.message}
        />
      </div>
      <div className="catalog-form__row">
        <FormSelect
          label="Perfil"
          placeholder="Seleccione un perfil"
          options={ROLE_OPTIONS}
          disabled={isRoleLocked}
          {...register('role')}
          error={errors.role?.message}
        />
        <TextField
          label={mode === 'create' ? 'Contraseña' : 'Nueva contraseña'}
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          hint={mode === 'create' ? 'Mínimo 8 caracteres' : 'Déjela vacía para conservar la actual'}
          {...register('password')}
          error={errors.password?.message}
        />
      </div>
    </>
  );
}
