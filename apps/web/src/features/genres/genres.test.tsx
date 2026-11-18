import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../shared/api/api-error';
import { renderWithProviders } from '../../test/render';
import { toGenreInput } from './domain/genre-form.schema';
import type { GenreSummary } from './domain/genre.types';
import { genresApi } from './infrastructure/genres.api';
import GenreCreatePage from './ui/GenreCreatePage';
import GenreEditPage from './ui/GenreEditPage';
import { GenresPage } from './ui/GenresPage';

vi.mock('./infrastructure/genres.api', () => ({
  genresApi: { listPage: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

const api = vi.mocked(genresApi);
const POETRY = { id: 'g1', name: 'Poesía', description: 'Obras en verso.' };
const ESSAY = { id: 'g2', name: 'Ensayo', description: null };

const pageOf = (items: GenreSummary[], page = 1, limit = 10, total = items.length) => ({
  items,
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
});

beforeEach(() => {
  // Block body: a returned value would be run by vitest as a cleanup callback.
  api.listPage.mockResolvedValue(
    pageOf([
      { ...ESSAY, activeBooks: 0 },
      { ...POETRY, activeBooks: 3 },
    ]),
  );
});

const row = (name: string) => screen.getByRole('row', { name: new RegExp(name) });

describe('genre form rules', () => {
  it('sends a blank description as null and trims the values', () => {
    expect(toGenreInput({ name: ' Cuento ', description: '  ' })).toEqual({
      name: 'Cuento',
      description: null,
    });
    expect(toGenreInput({ name: 'Cuento', description: ' Breve ' }).description).toBe('Breve');
  });
});

describe('GenresPage', () => {
  it('lists genres with description, active books and actions, without a creation form', async () => {
    renderWithProviders(<GenresPage />);

    expect(await screen.findByText('Poesía')).toBeInTheDocument();
    expect(within(row('Poesía')).getByText('Obras en verso.')).toBeInTheDocument();
    expect(within(row('Poesía')).getByText('3')).toBeInTheDocument();
    expect(within(row('Ensayo')).getByLabelText('Sin descripción')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Nombre',
      'Descripción',
      'Libros activos',
      'Acciones',
    ]);
    expect(screen.getByRole('link', { name: 'Editar Poesía' })).toHaveAttribute(
      'href',
      '/genres/g1/edit',
    );
    expect(screen.getByRole('link', { name: 'Agregar' })).toHaveAttribute('href', '/genres/new');
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();
  });

  it('asks the server for one page at a time', async () => {
    api.listPage.mockImplementation(async ({ page, limit }) =>
      pageOf(
        [{ ...ESSAY, id: `g${page}`, name: `Género ${page}`, activeBooks: 0 }],
        page,
        limit,
        25,
      ),
    );
    renderWithProviders(<GenresPage />);

    expect(await screen.findByText('Género 1')).toBeInTheDocument();
    expect(api.listPage).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(screen.getByText('Página 1 de 3 · 25 resultados')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Género 2')).toBeInTheDocument();
    expect(api.listPage).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });

  it('steps back to the last page when the current one is left empty (e.g. after a delete)', async () => {
    let total = 11; // The record that made page 2 exist is deleted before page 2 is requested.
    api.listPage.mockImplementation(async ({ page, limit }) => {
      if (page === 2) total = 10;
      return pageOf(page === 1 ? [{ ...ESSAY, activeBooks: 0 }] : [], page, limit, total);
    });
    renderWithProviders(<GenresPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Página 1 de 1 · 10 resultados')).toBeInTheDocument();
    expect(screen.getByText('Ensayo')).toBeInTheDocument();
  });
});

describe('GenreCreatePage', () => {
  it('creates a genre with an optional description', async () => {
    api.create.mockResolvedValue({ id: 'g3', name: 'Cuento', description: 'Narraciones breves.' });
    renderWithProviders(<GenreCreatePage />);

    await userEvent.type(await screen.findByLabelText('Nombre'), 'Cuento');
    await userEvent.type(screen.getByLabelText('Descripción'), 'Narraciones breves.');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        name: 'Cuento',
        description: 'Narraciones breves.',
      }),
    );
  });

  it('creates without a description and explains a repeated name', async () => {
    api.create.mockRejectedValue(new ApiError('taken', 409, 'CONFLICT'));
    renderWithProviders(<GenreCreatePage />);

    expect(await screen.findByRole('button', { name: 'Agregar' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Nombre'), 'Poesía');
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({ name: 'Poesía', description: null }),
    );
    expect(await screen.findByText('Ya existe un género con ese nombre.')).toBeInTheDocument();
  });
});

describe('GenreEditPage', () => {
  it('loads the genre, saves the changes and stays with a confirmation', async () => {
    api.get.mockResolvedValue(POETRY);
    api.update.mockResolvedValue({ ...POETRY, description: null });
    renderWithProviders(<GenreEditPage />, { route: '/genres/g1/edit', path: '/genres/:id/edit' });

    const description = await screen.findByLabelText('Descripción');
    expect(description).toHaveValue('Obras en verso.');
    await userEvent.clear(description);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('g1', { name: 'Poesía', description: null }),
    );
    expect(await screen.findByText('Los cambios se guardaron correctamente.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Volver a géneros' })).toHaveAttribute(
      'href',
      '/genres',
    );
  });

  it('explains when the genre cannot be loaded', async () => {
    api.get.mockRejectedValue(new ApiError('not found', 404, 'NOT_FOUND'));
    renderWithProviders(<GenreEditPage />, { route: '/genres/x/edit', path: '/genres/:id/edit' });

    expect(await screen.findByText('No se pudo cargar el género')).toBeInTheDocument();
  });
});
