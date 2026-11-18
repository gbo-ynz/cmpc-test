import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/application/useAuth';
import { AppLayout } from '../shared/ui/AppLayout';

/** Container: wires the auth feature into the presentational layout. */
export function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    queryClient.clear(); // never leak cached data to the next user
    navigate('/login', { replace: true });
  }, [logout, queryClient, navigate]);

  return <AppLayout userEmail={user?.email ?? ''} onLogout={handleLogout} />;
}
