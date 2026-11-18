import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../application/useAuth';

/** Route guard: unauthenticated users go to /login and come back afterwards. */
export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
