import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../shared/api/api-error';
import { renderWithProviders } from '../../test/render';
import { localToday, toAuthorInput } from './domain/author-form.schema';
import { formatBirthDate, type AuthorSummary } from './domain/author.types';
import { authorsApi } from './infrastructure/authors.api';
import AuthorCreatePage from './ui/AuthorCreatePage';
import AuthorEditPage from './ui/AuthorEditPage';
import { AuthorsPage } from './ui/AuthorsPage';

vi.mock('./infrastructure/authors.api', () => ({
  authorsApi: { listPage: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

const api = vi.mocked(authorsApi);
const MISTRAL = {
  id: 'a1',
  name: 'Gabriela Mistral',
  birthDate: '1889-04-07',
  biography: 'Poeta chilena, Premio Nobel 1945.',
};
const ANON = { id: 'a2', name: 'Anónimo', birthDate: null, biography: null };

const pageOf = (items: AuthorSummary[], page = 1, limit = 10, total = items.length) => ({
  items,
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
});

beforeEach(() => {
  // Block body: a returned value would be run by vitest as a cleanup callback.
  api.listPage.mockResolvedValue(
    pageOf([
      { ...ANON, activeBooks: 0 },
      { ...MISTRAL, activeBooks: 3 },
    ]),
  );
});

const row = (name: string) => screen.getByRole('row', { name: new RegExp(name) });

describe('author form rules', () => {
  it('formats birth dates without shifting the day and sends blanks as null', () => {
    expect(formatBirthDate('1889-04-07')).toMatch(/^7 .*abr.* 1889$/);
    expect(localToday(new Date('2026-11-18T12:00:00'))).toBe('2026-11-18');
    expect(toAuthorInput({ name: ' Borges ', birthDate: '', biography: '  ' })).toEqual({
      name: 'Borges',
      birthDate: null,
      biography: null,
    });
  });
});

describe('AuthorsPage', () => {
  it('lists authors with birth date, biography excerpt, active books and actions', async () => {
    renderWithProviders(<AuthorsPage />);

    expect(await screen.findByText('Gabriela Mistral')).toBeInTheDocument();
    const mistral = row('Gabriela Mistral');
    expect(within(mistral).getByText('Poeta chilena, Premio Nobel 1945.')).toBeInTheDocument();
    expect(within(mistral).getByText(formatBirthDate('1889-04-07'))).toHaveAttribute(
      'datetime',
      '1889-04-07',
    );
    expect(within(mistral).getByText('3')).toBeInTheDocument();
    expect(within(row('Anónimo')).getByLabelText('Sin fecha')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar Gabriela Mistral' })).toHaveAttribute(
      'href',
      '/authors/a1/edit',
    );
    expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Agregar' })).toHaveAttribute('href', '/authors/new');
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();
  });

  it('asks the server for one page at a time and for page 1 again when the size changes', async () => {
    api.listPage.mockImplementation(async ({ page, limit }) =>
      pageOf([{ ...ANON, id: `a${page}`, name: `Autor ${page}`, activeBooks: 0 }], page, limit, 25),
    );
    renderWithProviders(<AuthorsPage />);

    expect(await screen.findByText('Autor 1')).toBeInTheDocument();
    expect(api.listPage).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(screen.getByText('Página 1 de 3 · 25 resultados')).toBeInTheDocument();
    expect(screen.getByText('25 registros')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Autor 2')).toBeInTheDocument();
    expect(api.listPage).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });

  it('steps back to the last page when the current one is left empty (e.g. after a delete)', async () => {
    let total = 11; // The record that made page 2 exist is deleted before page 2 is requested.
    api.listPage.mockImplementation(async ({ page, limit }) => {
      if (page === 2) total = 10;
      return pageOf(page === 1 ? [{ ...ANON, activeBooks: 0 }] : [], page, limit, total);
    });
    renderWithProviders(<AuthorsPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Página 1 de 1 · 10 resultados')).toBeInTheDocument();
    expect(screen.getByText('Anónimo')).toBeInTheDocument();
  });
});

describe('AuthorCreatePage', () => {
  it('creates an author with optional details and returns to the list', async () => {
    api.create.mockResolvedValue({
      id: 'a3',
      name: 'Pablo Neruda',
      birthDate: '1904-07-12',
      biography: 'Poeta.',
    });
    renderWithProviders(<AuthorCreatePage />);
    await screen.findByRole('heading', { name: 'Nuevo autor' });

    await userEvent.type(screen.getByLabelText('Nombre'), 'Pablo Neruda');
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: '1904-07-12' },
    });
    await userEvent.type(screen.getByLabelText('Biografía'), 'Poeta.');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        name: 'Pablo Neruda',
        birthDate: '1904-07-12',
        biography: 'Poeta.',
      }),
    );
  });

  it('blocks a future birth date and explains a repeated name', async () => {
    api.create.mockRejectedValue(new ApiError('taken', 409, 'CONFLICT'));
    renderWithProviders(<AuthorCreatePage />);
    await screen.findByRole('heading', { name: 'Nuevo autor' });
    const birthDate = screen.getByLabelText('Fecha de nacimiento');

    await userEvent.type(screen.getByLabelText('Nombre'), 'Gabriela Mistral');
    fireEvent.change(birthDate, { target: { value: '2999-01-01' } });
    expect(await screen.findByText('La fecha no puede ser futura')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();

    fireEvent.change(birthDate, { target: { value: '' } });
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByText('Ya existe un autor con ese nombre.')).toBeInTheDocument();
  });
});

describe('AuthorEditPage', () => {
  it('loads the author, saves the changes and stays with a confirmation', async () => {
    api.get.mockResolvedValue(MISTRAL);
    api.update.mockResolvedValue({ ...MISTRAL, biography: null });
    renderWithProviders(<AuthorEditPage />, {
      route: '/authors/a1/edit',
      path: '/authors/:id/edit',
    });

    const biography = await screen.findByLabelText('Biografía');
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveValue('1889-04-07');
    await userEvent.clear(biography);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('a1', {
        name: 'Gabriela Mistral',
        birthDate: '1889-04-07',
        biography: null,
      }),
    );
    expect(await screen.findByText('Los cambios se guardaron correctamente.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Volver a autores' })).toHaveAttribute(
      'href',
      '/authors',
    );
  });

  it('explains when the author cannot be loaded', async () => {
    api.get.mockRejectedValue(new ApiError('not found', 404, 'NOT_FOUND'));
    renderWithProviders(<AuthorEditPage />, {
      route: '/authors/x/edit',
      path: '/authors/:id/edit',
    });

    expect(await screen.findByText('No se pudo cargar el autor')).toBeInTheDocument();
  });
});
