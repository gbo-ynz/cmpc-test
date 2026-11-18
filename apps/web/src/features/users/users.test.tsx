import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../shared/api/api-error';
import { renderWithProviders } from '../../test/render';
import {
  createUserSchema,
  editUserSchema,
  toUserInput,
  type UserFormValues,
} from './domain/user-form.schema';
import type { ManagedUser } from './domain/user.types';
import { usersApi } from './infrastructure/users.api';
import UserCreatePage from './ui/UserCreatePage';
import UserEditPage from './ui/UserEditPage';
import { UsersPage } from './ui/UsersPage';

vi.mock('./infrastructure/users.api', () => ({
  usersApi: { listPage: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const api = vi.mocked(usersApi);
const ME: ManagedUser = {
  id: 'u1',
  name: 'Admin',
  email: 'admin@cmpc.cl',
  role: 'ADMIN',
  createdAt: '',
};
const ANA: ManagedUser = {
  id: 'u2',
  name: 'Ana Pérez',
  email: 'ana@cmpc.cl',
  role: 'USER',
  createdAt: '',
};

const pageOf = (items: ManagedUser[], page = 1, limit = 10, total = items.length) => ({
  items,
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
});

beforeEach(() => {
  // Block body: a returned value would be run by vitest as a cleanup callback.
  api.listPage.mockResolvedValue(pageOf([ME, ANA]));
});

const row = (name: string) => screen.getByRole('row', { name: new RegExp(name) });
const VALID: UserFormValues = {
  name: 'Ana',
  email: 'ana@cmpc.cl',
  role: 'USER',
  password: 'secret123',
};

describe('user form rules', () => {
  it('requires a password of 8+ characters only when creating', () => {
    expect(createUserSchema.safeParse({ ...VALID, password: '' }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...VALID, password: 'short' }).success).toBe(false);
    expect(editUserSchema.safeParse({ ...VALID, password: '' }).success).toBe(true);
    expect(editUserSchema.safeParse({ ...VALID, password: 'short' }).success).toBe(false);
  });

  it('validates the email and the profile', () => {
    expect(createUserSchema.safeParse({ ...VALID, email: 'nope' }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...VALID, role: '' }).success).toBe(false);
  });

  it('does not send an empty password and trims the rest', () => {
    expect(toUserInput({ ...VALID, name: ' Ana ', password: '' })).toEqual({
      name: 'Ana',
      email: 'ana@cmpc.cl',
      role: 'USER',
    });
    expect(toUserInput(VALID).password).toBe('secret123');
  });
});

describe('UsersPage', () => {
  it('lists name, email and profile, and cannot delete the signed-in administrator', async () => {
    renderWithProviders(<UsersPage />);

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(within(row('Ana Pérez')).getByText('Usuario')).toBeInTheDocument();
    expect(within(row('Admin')).getByText('Administrador')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Nombre',
      'Correo electrónico',
      'Perfil',
      'Acciones',
    ]);
    expect(screen.getByRole('link', { name: 'Agregar' })).toHaveAttribute('href', '/users/new');
    expect(screen.getByRole('link', { name: 'Editar Ana Pérez' })).toHaveAttribute(
      'href',
      '/users/u2/edit',
    );
    expect(screen.getByRole('button', { name: 'Eliminar Ana Pérez' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar Admin' })).not.toBeInTheDocument();
  });

  it('asks the server for one page at a time', async () => {
    api.listPage.mockImplementation(async ({ page, limit }) =>
      pageOf([{ ...ANA, id: `u${page}`, name: `Usuario ${page}` }], page, limit, 25),
    );
    renderWithProviders(<UsersPage />);

    expect(await screen.findByText('Usuario 1')).toBeInTheDocument();
    expect(api.listPage).toHaveBeenCalledWith({ page: 1, limit: 10 });
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Usuario 2')).toBeInTheDocument();
    expect(api.listPage).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });

  it('asks for confirmation before deactivating and then refreshes the list', async () => {
    api.remove.mockResolvedValue(undefined);
    renderWithProviders(<UsersPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Ana Pérez' }));

    expect(api.remove).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('u2'));
    await waitFor(() => expect(api.listPage).toHaveBeenCalledTimes(2));
  });
});

describe('UserCreatePage', () => {
  it('creates a user with profile and password', async () => {
    api.create.mockResolvedValue(ANA);
    renderWithProviders(<UserCreatePage />);

    await userEvent.type(await screen.findByLabelText('Nombre'), 'Ana');
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@cmpc.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() => expect(api.create).toHaveBeenCalledWith(VALID));
  });

  it('keeps the button disabled without a valid password and explains a repeated email', async () => {
    api.create.mockRejectedValue(new ApiError('taken', 409, 'CONFLICT'));
    renderWithProviders(<UserCreatePage />);
    fireEvent.change(await screen.findByLabelText('Nombre'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'ana@cmpc.cl' },
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled());
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret123' } });
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar' }));

    expect(
      await screen.findByText('Ya existe un usuario con ese correo electrónico.'),
    ).toBeInTheDocument();
  });
});

describe('UserEditPage', () => {
  const renderEdit = (id: string, user: ManagedUser) => {
    api.get.mockResolvedValue(user);
    return renderWithProviders(<UserEditPage />, {
      route: `/users/${id}/edit`,
      path: '/users/:id/edit',
    });
  };

  it('keeps the password when it is left empty and confirms the save', async () => {
    api.update.mockResolvedValue(ANA);
    renderEdit('u2', ANA);

    const name = await screen.findByLabelText('Nombre');
    expect(screen.getByLabelText('Nueva contraseña')).toHaveValue('');
    await userEvent.clear(name);
    await userEvent.type(name, 'Ana María');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('u2', {
        name: 'Ana María',
        email: 'ana@cmpc.cl',
        role: 'USER',
      }),
    );
    expect(await screen.findByText('Los cambios se guardaron correctamente.')).toBeInTheDocument();
  });

  it('sends a new password only when typed', async () => {
    api.update.mockResolvedValue(ANA);
    renderEdit('u2', ANA);

    await userEvent.type(await screen.findByLabelText('Nueva contraseña'), 'newsecret1');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith(
        'u2',
        expect.objectContaining({ password: 'newsecret1' }),
      ),
    );
  });

  it('locks the profile of the signed-in administrator', async () => {
    renderEdit('u1', ME);

    expect(await screen.findByLabelText('Perfil')).toBeDisabled();
  });
});
