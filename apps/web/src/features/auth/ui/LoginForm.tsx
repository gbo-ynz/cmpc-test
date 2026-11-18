import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { TextField } from '../../../shared/ui/TextField';
import { useAuth } from '../application/useAuth';
import { credentialsSchema, type Credentials } from '../domain/auth.types';

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<unknown>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({ resolver: zodResolver(credentialsSchema), mode: 'onTouched' });

  const onSubmit = handleSubmit(async (credentials) => {
    setServerError(null);
    try {
      await login(credentials);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(error);
    }
  });

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <TextField
        label="Correo electrónico"
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {serverError ? <ErrorBanner error={serverError} title="No se pudo iniciar sesión" /> : null}
      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Iniciar sesión
      </Button>
    </form>
  );
}
