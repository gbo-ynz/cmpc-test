import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/render';
import { referencesApi } from '../../../references/infrastructure/references.api';
import { BookForm } from './BookForm';

vi.mock('../../../references/infrastructure/references.api', () => ({
  referencesApi: { list: vi.fn() },
}));

const CATALOG = {
  authors: [{ id: 'a1', name: 'Julio Cortázar', activeBooks: 1 }],
  publishers: [{ id: 'p1', name: 'Sudamericana', activeBooks: 1 }],
  genres: [{ id: 'g1', name: 'Novela', activeBooks: 1 }],
};

const VALUES = {
  title: 'Rayuela',
  authorId: 'a1',
  publisherId: 'p1',
  genreId: 'g1',
  price: 16990,
  stock: 4,
};

async function fillForm() {
  await userEvent.type(screen.getByLabelText('Título'), VALUES.title);
  await userEvent.selectOptions(await screen.findByLabelText('Autor'), 'Julio Cortázar');
  await userEvent.selectOptions(screen.getByLabelText('Editorial'), 'Sudamericana');
  await userEvent.selectOptions(screen.getByLabelText('Género'), 'Novela');
  await userEvent.clear(screen.getByLabelText('Precio (CLP)'));
  await userEvent.type(screen.getByLabelText('Precio (CLP)'), String(VALUES.price));
  await userEvent.clear(screen.getByLabelText('Stock (unidades)'));
  await userEvent.type(screen.getByLabelText('Stock (unidades)'), String(VALUES.stock));
}

describe('BookForm', () => {
  beforeEach(() => {
    vi.mocked(referencesApi.list).mockImplementation((kind) => Promise.resolve(CATALOG[kind]));
  });

  it('validates reactively while the user types', async () => {
    renderWithProviders(<BookForm submitLabel="Crear libro" onSubmit={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Título'), 'x');
    await userEvent.clear(screen.getByLabelText('Título'));
    await userEvent.clear(screen.getByLabelText('Precio (CLP)'));

    expect(await screen.findByText('Ingrese el título')).toBeInTheDocument();
    expect(await screen.findByText('Ingrese el precio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear libro' })).toBeDisabled();
  });

  it('rejects a negative or fractional stock', async () => {
    renderWithProviders(<BookForm submitLabel="Crear libro" onSubmit={vi.fn()} />);
    const stock = screen.getByLabelText('Stock (unidades)');

    await userEvent.clear(stock);
    await userEvent.type(stock, '1.5');

    expect(await screen.findByText('El stock debe ser un número entero')).toBeInTheDocument();
  });

  it('submits the selected catalog ids together with the image', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<BookForm submitLabel="Crear libro" onSubmit={onSubmit} />);
    const image = new File(['x'], 'cover.webp', { type: 'image/webp' });

    await fillForm();
    await userEvent.upload(screen.getByLabelText('Imagen de portada'), image);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Crear libro' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(VALUES, image));
  });

  it('keeps the edit form disabled until something changes', async () => {
    renderWithProviders(
      <BookForm defaultValues={VALUES} submitLabel="Guardar cambios" onSubmit={vi.fn()} />,
    );
    const submit = screen.getByRole('button', { name: 'Guardar cambios' });

    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Stock (unidades)'), '0');

    await waitFor(() => expect(submit).toBeEnabled());
  });

  it('offers every existing record of each catalog', async () => {
    renderWithProviders(<BookForm submitLabel="Crear libro" onSubmit={vi.fn()} />);

    const author = await screen.findByLabelText('Autor');
    await waitFor(() =>
      expect(within(author).getByRole('option', { name: 'Julio Cortázar' })).toBeInTheDocument(),
    );
    expect(referencesApi.list).toHaveBeenCalledWith('genres');
  });
});
