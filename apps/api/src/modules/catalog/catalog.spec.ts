import { GetCatalogUseCase } from './application/get-catalog.use-case';
import type { Catalog, CatalogRepository } from './domain/catalog';
import { CatalogController } from './presentation/catalog.controller';

const CATALOG: Catalog = {
  authors: [{ id: 'a1', name: 'Isabel Allende' }],
  publishers: [{ id: 'p1', name: 'Sudamericana' }],
  genres: [{ id: 'g1', name: 'Novela' }],
};

describe('Catalog', () => {
  it('returns the reference data through use case and controller', async () => {
    const repository: CatalogRepository = { load: jest.fn().mockResolvedValue(CATALOG) };
    const controller = new CatalogController(new GetCatalogUseCase(repository));

    await expect(controller.find()).resolves.toEqual(CATALOG);
    expect(repository.load).toHaveBeenCalledTimes(1);
  });
});
