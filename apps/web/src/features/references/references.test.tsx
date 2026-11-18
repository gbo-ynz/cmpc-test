import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../shared/api/api-error';
import { renderWithProviders } from '../../test/render';
import { RequireRole } from '../auth/ui/RequireRole';
import { referencesApi } from './infrastructure/references.api';
import { ReferencesPage } from './ui/ReferencesPage';

vi.mock('./infrastructure/references.api', () => ({
  referencesApi: { list: vi.fn(), create: vi.fn(), rename: vi.fn(), remove: vi.fn() },
}));

const api = vi.mocked(referencesApi);
const BORGES = { id: 'a1', name: 'Jorge Luis Borges', activeBooks: 2 };
const SABATO = { id: 'a2', name: 'Ernesto Sabato', activeBooks: 0 };

beforeEach(() => api.list.mockResolvedValue([SABATO, BORGES]));

const row = (name: string) => screen.getByRole('row', { name: new RegExp(name) });

describe('ReferencesPage', () => {
  it('lists the records of its kind with their active books', async () => {
    renderWithProviders(<ReferencesPage kind="authors" />);

    expect(screen.getByRole('heading', { name: 'Autores' })).toBeInTheDocument();
    expect(await screen.findByText('Jorge Luis Borges')).toBeInTheDocument();
    expect(within(row('Borges')).getByText('2')).toBeInTheDocument();
    expect(api.list).toHaveBeenCalledWith('authors');
  });

  it('adds a record, with the button disabled while the name is empty', async () => {
    api.create.mockResolvedValue({ ...SABATO, id: 'a3', name: 'Isabel Allende' });
    renderWithProviders(<ReferencesPage kind="publishers" />);
    const add = screen.getByRole('button', { name: 'Agregar' });

    expect(add).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Nueva editorial'), '  Isabel Allende ');
    await userEvent.click(add);

    expect(api.create).toHaveBeenCalledWith('publishers', 'Isabel Allende');
  });

  it('explains a repeated name', async () => {
    api.create.mockRejectedValue(new ApiError('exists', 409, 'CONFLICT'));
    renderWithProviders(<ReferencesPage kind="genres" />);

    await userEvent.type(screen.getByLabelText('Nuevo género'), 'Novela');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe un género con ese nombre.',
    );
  });

  it('renames a record in place', async () => {
    api.rename.mockResolvedValue({ ...BORGES, name: 'J. L. Borges' });
    renderWithProviders(<ReferencesPage kind="authors" />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Renombrar Jorge Luis Borges' }),
    );
    const input = screen.getByLabelText('Nuevo nombre de Jorge Luis Borges');
    await userEvent.clear(input);
    await userEvent.type(input, 'J. L. Borges');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(api.rename).toHaveBeenCalledWith('authors', 'a1', 'J. L. Borges');
  });

  it('asks for confirmation before deleting and explains why a record with books cannot go', async () => {
    api.remove.mockRejectedValue(new ApiError('in use', 409, 'CONFLICT'));
    renderWithProviders(<ReferencesPage kind="authors" />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Eliminar Jorge Luis Borges' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('authors', 'a1'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede eliminar: tiene libros asociados.',
    );
  });
});

describe('RequireRole', () => {
  it('shows the page to an administrator and a clear message to anyone else', () => {
    const admin = renderWithProviders(<RequireRole role="ADMIN" />, {
      extraRoutes: {},
    });
    expect(screen.queryByText('No tiene permisos para ver esta página')).not.toBeInTheDocument();
    admin.unmount();

    renderWithProviders(<RequireRole role="ADMIN" />, {
      auth: { user: { id: 'u2', email: 'usuario@cmpc.cl', name: 'Usuario', role: 'USER' } },
    });

    expect(
      screen.getByRole('heading', { name: 'No tiene permisos para ver esta página' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inventario' })).toHaveAttribute(
      'href',
      '/books',
    );
  });
});
