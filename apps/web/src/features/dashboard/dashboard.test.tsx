import { screen, within } from '@testing-library/react';
import { ApiError } from '../../shared/api/api-error';
import { renderWithProviders } from '../../test/render';
import { describeActivity } from './domain/activity-labels';
import type { Dashboard } from './domain/dashboard.types';
import { dashboardApi } from './infrastructure/dashboard.api';
import { DashboardPage } from './ui/DashboardPage';

vi.mock('./infrastructure/dashboard.api', () => ({ dashboardApi: { get: vi.fn() } }));

const api = vi.mocked(dashboardApi);
const OPERATION: Dashboard = {
  books: { active: 12, available: 9, unavailable: 3 },
  booksByGenre: [
    { genre: 'Novela', books: 6 },
    { genre: 'Ensayo', books: 3 },
  ],
  sales: { pending: 4, completed: 7, completedAmount: 123500 },
};
const FULL: Dashboard = {
  ...OPERATION,
  administration: {
    inventoryValue: 1500000,
    catalog: { authors: 8, publishers: 6, genres: 4, users: 3 },
    recentActivity: [
      {
        action: 'CREATE',
        entityType: 'Book',
        label: 'Rayuela',
        actorName: 'Ana',
        createdAt: '2026-03-10T15:30:00Z',
      },
      {
        action: 'MYSTERY',
        entityType: 'Thing',
        label: null,
        actorName: null,
        createdAt: '2026-03-10T15:00:00Z',
      },
    ],
  },
};

const card = (label: string) => screen.getByText(label).closest('.stat-card') as HTMLElement;

describe('DashboardPage for a regular user', () => {
  beforeEach(() => {
    // Block body: a returned value would be run by vitest as a cleanup callback.
    api.get.mockResolvedValue(OPERATION);
  });

  it('shows the inventory, the sales and the books per genre', async () => {
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Libros activos')).toBeInTheDocument();
    expect(within(card('Libros activos')).getByText('12')).toBeInTheDocument();
    expect(within(card('Disponibles')).getByText('9')).toBeInTheDocument();
    expect(within(card('No disponibles')).getByText('3')).toBeInTheDocument();
    expect(within(card('Ventas pendientes')).getByText('4')).toBeInTheDocument();
    expect(within(card('Ventas completadas')).getByText('7')).toBeInTheDocument();
    expect(within(card('Monto vendido')).getByText('$123.500')).toBeInTheDocument();
    expect(screen.getByText('Novela')).toBeInTheDocument();
    expect(screen.getByText('Resumen de la operación')).toBeInTheDocument();
  });

  it('shows nothing of the administration: no value, counters or audit trail', async () => {
    renderWithProviders(<DashboardPage />);
    await screen.findByText('Libros activos');

    for (const hidden of [
      'Valor del inventario disponible',
      'Administración',
      'Actividad reciente',
      'Autores',
      'Usuarios',
    ]) {
      expect(screen.queryByText(hidden)).not.toBeInTheDocument();
    }
  });
});

describe('DashboardPage for an administrator', () => {
  beforeEach(() => {
    api.get.mockResolvedValue(FULL);
  });

  it('adds the inventory value and the administration counters, linked to their screens', async () => {
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Resumen general del sistema')).toBeInTheDocument();
    expect(
      within(card('Valor del inventario disponible')).getByText('$1.500.000'),
    ).toBeInTheDocument();
    expect(within(card('Autores')).getByText('8')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Autores' })).toHaveAttribute('href', '/authors');
    expect(screen.getByRole('link', { name: 'Editoriales' })).toHaveAttribute(
      'href',
      '/publishers',
    );
    expect(screen.getByRole('link', { name: 'Géneros' })).toHaveAttribute('href', '/genres');
    expect(screen.getByRole('link', { name: 'Usuarios' })).toHaveAttribute('href', '/users');
  });

  it('lists the recent audit operations in Spanish and keeps unknown ones visible', async () => {
    renderWithProviders(<DashboardPage />);

    const created = await screen.findByRole('row', { name: /Creó libro/ });
    expect(created).toHaveTextContent('Rayuela');
    expect(created).toHaveTextContent('Ana');
    expect(screen.getByRole('row', { name: /MYSTERY Thing/ })).toBeInTheDocument();
  });

  it('says so when there is no activity yet', async () => {
    api.get.mockResolvedValue({
      ...FULL,
      administration: { ...FULL.administration!, recentActivity: [] },
    });
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Todavía no hay operaciones registradas.')).toBeInTheDocument();
  });
});

describe('DashboardPage states', () => {
  it('explains when the dashboard cannot be loaded', async () => {
    api.get.mockRejectedValue(new ApiError('x', 500, 'INTERNAL_ERROR'));
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('No se pudo cargar el dashboard')).toBeInTheDocument();
  });

  it('handles a system without books per genre', async () => {
    api.get.mockResolvedValue({ ...OPERATION, booksByGenre: [] });
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Todavía no hay géneros.')).toBeInTheDocument();
  });
});

describe('describeActivity', () => {
  it('reads like a sentence for every kind of operation', () => {
    expect(describeActivity('CREATE', 'Book')).toBe('Creó libro');
    expect(describeActivity('COMPLETE', 'Sale')).toBe('Completó venta');
    expect(describeActivity('UPLOAD_IMAGE', 'Book')).toBe('Subió la portada del libro');
    expect(describeActivity('EXPORT', 'Author')).toBe('Exportó autores');
    expect(describeActivity('LOGIN', 'User')).toBe('Inició sesión');
    expect(describeActivity('LOGIN_FAILED', 'User')).toBe('Intento fallido de inicio de sesión');
  });

  it('keeps unknown actions and entities visible instead of hiding them', () => {
    expect(describeActivity('NEW_ACTION', 'Gadget')).toBe('NEW_ACTION Gadget');
  });
});
