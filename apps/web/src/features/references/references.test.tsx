import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../shared/api/api-error';
import { renderWithProviders } from '../../test/render';
import { RequireRole } from '../auth/ui/RequireRole';
import { downloadBlob } from '../../shared/lib/download';
import { referencesApi } from './infrastructure/references.api';
import { DeleteReferenceButton } from './ui/DeleteReferenceButton';
import { ExportReferencesButton } from './ui/ExportReferencesButton';

vi.mock('./infrastructure/references.api', () => ({
  referencesApi: { list: vi.fn(), remove: vi.fn(), exportCsv: vi.fn() },
}));
vi.mock('../../shared/lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/lib/download')>()),
  downloadBlob: vi.fn(),
}));

const api = vi.mocked(referencesApi);
const SUR = { id: 'p1', name: 'Sur', activeBooks: 0 };

describe('DeleteReferenceButton', () => {
  it('asks for confirmation before deleting', async () => {
    api.remove.mockResolvedValue();
    renderWithProviders(<DeleteReferenceButton kind="publishers" reference={SUR} />);

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Sur' }));
    expect(api.remove).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('publishers', 'p1'));
  });

  it('lets the admin cancel and explains why a record with books cannot go', async () => {
    api.remove.mockRejectedValue(new ApiError('in use', 409, 'CONFLICT'));
    renderWithProviders(<DeleteReferenceButton kind="genres" reference={SUR} />);

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Sur' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Eliminar Sur' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Sur' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede eliminar: tiene libros asociados, aunque estén eliminados (se conservan por el historial).',
    );
  });
});

describe('ExportReferencesButton', () => {
  it.each([
    ['authors', 'autores'],
    ['publishers', 'editoriales'],
    ['genres', 'generos'],
  ] as const)('downloads the whole %s catalog as a dated CSV', async (kind, prefix) => {
    const blob = new Blob(['csv']);
    api.exportCsv.mockResolvedValue(blob);
    renderWithProviders(<ExportReferencesButton kind={kind} />);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => expect(api.exportCsv).toHaveBeenCalledWith(kind));
    expect(downloadBlob).toHaveBeenCalledWith(
      blob,
      expect.stringMatching(new RegExp(`^${prefix}-\\d{4}-\\d{2}-\\d{2}\\.csv$`)),
    );
  });

  it('explains when the export fails', async () => {
    api.exportCsv.mockRejectedValue(new ApiError('forbidden', 403, 'FORBIDDEN'));
    renderWithProviders(<ExportReferencesButton kind="authors" />);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(downloadBlob).not.toHaveBeenCalled();
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
