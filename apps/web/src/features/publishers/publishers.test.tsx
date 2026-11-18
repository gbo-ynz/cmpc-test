import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../shared/api/api-error';
import { renderWithProviders } from '../../test/render';
import { toPublisherInput } from './domain/publisher-form.schema';
import type { PublisherSummary } from './domain/publisher.types';
import { publishersApi } from './infrastructure/publishers.api';
import PublisherCreatePage from './ui/PublisherCreatePage';
import PublisherEditPage from './ui/PublisherEditPage';
import { PublishersPage } from './ui/PublishersPage';

vi.mock('./infrastructure/publishers.api', () => ({
  publishersApi: { listPage: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

const api = vi.mocked(publishersApi);
const SUDAMERICANA = { id: 'p1', name: 'Sudamericana', country: 'Argentina' };
const ANON = { id: 'p2', name: 'Independiente', country: null };

const pageOf = (items: PublisherSummary[], page = 1, limit = 10, total = items.length) => ({
  items,
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
});

beforeEach(() => {
  // Block body: a returned value would be run by vitest as a cleanup callback.
  api.listPage.mockResolvedValue(
    pageOf([
      { ...ANON, activeBooks: 0 },
      { ...SUDAMERICANA, activeBooks: 3 },
    ]),
  );
});

const row = (name: string) => screen.getByRole('row', { name: new RegExp(name) });

describe('publisher form rules', () => {
  it('sends a blank country as null and trims the values', () => {
    expect(toPublisherInput({ name: ' Sur ', country: '  ' })).toEqual({
      name: 'Sur',
      country: null,
    });
    expect(toPublisherInput({ name: 'Sur', country: ' Chile ' }).country).toBe('Chile');
  });
});

describe('PublishersPage', () => {
  it('lists publishers with country, active books and actions, without a creation form', async () => {
    renderWithProviders(<PublishersPage />);

    expect(await screen.findByText('Sudamericana')).toBeInTheDocument();
    expect(within(row('Sudamericana')).getByText('Argentina')).toBeInTheDocument();
    expect(within(row('Sudamericana')).getByText('3')).toBeInTheDocument();
    expect(within(row('Independiente')).getByLabelText('Sin país')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Nombre',
      'País',
      'Libros activos',
      'Acciones',
    ]);
    expect(screen.getByRole('link', { name: 'Editar Sudamericana' })).toHaveAttribute(
      'href',
      '/publishers/p1/edit',
    );
    expect(screen.getByRole('link', { name: 'Agregar' })).toHaveAttribute(
      'href',
      '/publishers/new',
    );
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();
  });

  it('asks the server for one page at a time', async () => {
    api.listPage.mockImplementation(async ({ page, limit }) =>
      pageOf(
        [{ ...ANON, id: `p${page}`, name: `Editorial ${page}`, activeBooks: 0 }],
        page,
        limit,
        25,
      ),
    );
    renderWithProviders(<PublishersPage />);

    expect(await screen.findByText('Editorial 1')).toBeInTheDocument();
    expect(api.listPage).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(screen.getByText('Página 1 de 3 · 25 resultados')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Editorial 2')).toBeInTheDocument();
    expect(api.listPage).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });

  it('steps back to the last page when the current one is left empty (e.g. after a delete)', async () => {
    let total = 11; // The record that made page 2 exist is deleted before page 2 is requested.
    api.listPage.mockImplementation(async ({ page, limit }) => {
      if (page === 2) total = 10;
      return pageOf(page === 1 ? [{ ...ANON, activeBooks: 0 }] : [], page, limit, total);
    });
    renderWithProviders(<PublishersPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Página 1 de 1 · 10 resultados')).toBeInTheDocument();
    expect(screen.getByText('Independiente')).toBeInTheDocument();
  });
});

describe('PublisherCreatePage', () => {
  it('creates a publisher with an optional country', async () => {
    api.create.mockResolvedValue({ id: 'p3', name: 'Losada', country: 'Argentina' });
    renderWithProviders(<PublisherCreatePage />);

    await userEvent.type(await screen.findByLabelText('Nombre'), 'Losada');
    await userEvent.type(screen.getByLabelText('País'), 'Argentina');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({ name: 'Losada', country: 'Argentina' }),
    );
  });

  it('creates without a country and explains a repeated name', async () => {
    api.create.mockRejectedValue(new ApiError('taken', 409, 'CONFLICT'));
    renderWithProviders(<PublisherCreatePage />);
    const name = await screen.findByLabelText('Nombre');

    expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
    fireEvent.change(name, { target: { value: 'Sudamericana' } });
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({ name: 'Sudamericana', country: null }),
    );
    expect(await screen.findByText('Ya existe una editorial con ese nombre.')).toBeInTheDocument();
  });
});

describe('PublisherEditPage', () => {
  it('loads the publisher, saves the changes and stays with a confirmation', async () => {
    api.get.mockResolvedValue(SUDAMERICANA);
    api.update.mockResolvedValue({ ...SUDAMERICANA, country: null });
    renderWithProviders(<PublisherEditPage />, {
      route: '/publishers/p1/edit',
      path: '/publishers/:id/edit',
    });

    const country = await screen.findByLabelText('País');
    expect(country).toHaveValue('Argentina');
    await userEvent.clear(country);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('p1', { name: 'Sudamericana', country: null }),
    );
    expect(await screen.findByText('Los cambios se guardaron correctamente.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Volver a editoriales' })).toHaveAttribute(
      'href',
      '/publishers',
    );
  });

  it('explains when the publisher cannot be loaded', async () => {
    api.get.mockRejectedValue(new ApiError('not found', 404, 'NOT_FOUND'));
    renderWithProviders(<PublisherEditPage />, {
      route: '/publishers/x/edit',
      path: '/publishers/:id/edit',
    });

    expect(await screen.findByText('No se pudo cargar la editorial')).toBeInTheDocument();
  });
});
