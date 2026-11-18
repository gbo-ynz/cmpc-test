import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthenticatedLayout } from '../../app/AuthenticatedLayout';
import { ApiError } from '../../shared/api/api-error';
import { SESSION_EXPIRED_EVENT, httpClient } from '../../shared/api/http-client';
import { sessionStorage } from '../../shared/auth/session-storage';
import { fakeAuth, renderWithProviders } from '../../test/render';
import { AuthProvider } from './application/AuthProvider';
import { AuthContext } from './application/auth-context';
import { useAuth } from './application/useAuth';
import { credentialsSchema } from './domain/auth.types';
import { authApi } from './infrastructure/auth.api';
import { LoginPage } from './ui/LoginPage';
import { RequireAuth } from './ui/RequireAuth';

const USER = { id: 'u1', email: 'admin@cmpc.cl', name: 'Admin', role: 'ADMIN' as const };
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('credentialsSchema', () => {
  it('validates email format and password length', () => {
    const result = credentialsSchema.safeParse({ email: 'nope', password: 'short' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Ingrese un correo electrónico válido',
      'La contraseña debe tener al menos 8 caracteres',
    ]);
  });
});

describe('authApi', () => {
  it('maps the login response to a session', async () => {
    const post = vi
      .spyOn(httpClient, 'post')
      .mockResolvedValue({ data: { success: true, data: { accessToken: 'jwt', user: USER } } });

    await expect(authApi.login({ email: USER.email, password: 'Admin123!' })).resolves.toEqual({
      token: 'jwt',
      user: USER,
    });
    expect(post).toHaveBeenCalledWith('/auth/login', { email: USER.email, password: 'Admin123!' });
  });
});

describe('AuthProvider', () => {
  it('persists the session on login and clears it on logout', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({ token: 'jwt', user: USER });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(() => result.current.login({ email: USER.email, password: 'Admin123!' }));
    expect(result.current.user).toEqual(USER);
    expect(sessionStorage.read()?.token).toBe('jwt');

    act(() => result.current.logout());
    expect(result.current.user).toBeNull();
  });

  it('logs out when the HTTP client reports an expired session', () => {
    sessionStorage.write({ token: 'jwt', user: USER });
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toEqual(USER);

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });

    expect(result.current.user).toBeNull();
  });

  it('fails loudly when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useAuth())).toThrow(/inside <AuthProvider>/);
  });
});

describe('LoginPage', () => {
  it('shows reactive validation errors', async () => {
    renderWithProviders(<LoginPage />, { route: '/login', path: '/login', auth: { user: null } });

    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Ingrese su correo electrónico')).toBeInTheDocument();
  });

  it('signs in and lands on the dashboard', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginPage />, {
      route: '/login',
      path: '/login',
      auth: { user: null, login },
      extraRoutes: { '/dashboard': <p>Pantalla de inicio</p> },
    });

    await userEvent.type(screen.getByLabelText('Correo electrónico'), USER.email);
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Admin123!');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Pantalla de inicio')).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({ email: USER.email, password: 'Admin123!' });
  });

  it('shows the server error on invalid credentials', async () => {
    const login = vi
      .fn()
      .mockRejectedValue(new ApiError('Invalid email or password', 401, 'UNAUTHORIZED'));
    renderWithProviders(<LoginPage />, {
      route: '/login',
      path: '/login',
      auth: { user: null, login },
    });

    await userEvent.type(screen.getByLabelText('Correo electrónico'), USER.email);
    await userEvent.type(screen.getByLabelText('Contraseña'), 'WrongPass1');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('redirects already authenticated users', () => {
    renderWithProviders(<LoginPage />, {
      route: '/login',
      path: '/login',
      extraRoutes: { '/dashboard': <p>Pantalla de inicio</p> },
    });

    expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument();
  });
});

describe('login destination', () => {
  const lands = (state: object | null) =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthContext.Provider value={fakeAuth()}>
          <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<p>Dashboard</p>} />
              <Route path="/sales/new" element={<p>Nueva venta</p>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

  it('goes to the dashboard for any profile when no page was requested', () => {
    lands(null);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('returns to the requested page when a protected route sent the user to the login', () => {
    lands({ from: '/sales/new' });

    expect(screen.getByText('Nueva venta')).toBeInTheDocument();
  });
});

describe('RequireAuth', () => {
  it('sends anonymous users to the login page', () => {
    renderWithProviders(<RequireAuth />, {
      route: '/books',
      path: '/books',
      auth: { user: null },
      extraRoutes: { '/login': <p>Login screen</p> },
    });

    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });
});

describe('AuthenticatedLayout menu', () => {
  const menu = () => screen.getByRole('navigation', { name: 'Principal' });

  it('shows the administration sections to an administrator', () => {
    renderWithProviders(<AuthenticatedLayout />, { route: '/books', path: '/books' });

    for (const section of [
      'Inventario',
      'Ventas',
      'Autores',
      'Editoriales',
      'Géneros',
      'Usuarios',
    ]) {
      expect(within(menu()).getByRole('link', { name: section })).toBeInTheDocument();
    }
  });

  it('shows only the inventory and the sales to a regular user', () => {
    renderWithProviders(<AuthenticatedLayout />, {
      route: '/books',
      path: '/books',
      auth: { user: { id: 'u2', email: 'usuario@cmpc.cl', name: 'Usuario', role: 'USER' } },
    });

    const labels = within(menu())
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(labels).toEqual(['Dashboard', 'Inventario', 'Ventas']);
  });
});

describe('AuthenticatedLayout', () => {
  it('logs out, clears the cache and goes to login', async () => {
    const auth = fakeAuth();
    const queryClient = new QueryClient();
    const clear = vi.spyOn(queryClient, 'clear');
    const { AuthContext } = await import('./application/auth-context');
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={['/books']}>
            <Routes>
              <Route path="/books" element={<AuthenticatedLayout />} />
              <Route path="/login" element={<p>Login screen</p>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(auth.logout).toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });
});
