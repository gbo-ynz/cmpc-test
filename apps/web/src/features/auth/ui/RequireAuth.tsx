import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../application/useAuth';

/**
 * Route guard: unauthenticated users go to /login. Only when the session ended on its own (expired
 * or anonymous access) do they come back to this page afterwards; a deliberate sign out starts over
 * from the dashboard.
 */
export function RequireAuth() {
  const { user, signedOutByUser } = useAuth();
  const location = useLocation();

  if (!user) {
    const state = signedOutByUser ? undefined : { from: location.pathname };
    return <Navigate to="/login" replace state={state} />;
  }

  return <Outlet />;
}
