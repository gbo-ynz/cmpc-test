import { Injectable } from '@nestjs/common';
import { Catalog, CatalogRepository } from '../domain/catalog';

@Injectable()
export class GetCatalogUseCase {
  constructor(private readonly catalog: CatalogRepository) {}

  execute(): Promise<Catalog> {
    return this.catalog.load();
  }
}
