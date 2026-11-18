import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCatalogUseCase } from '../application/get-catalog.use-case';
import { Catalog } from '../domain/catalog';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly getCatalog: GetCatalogUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Authors, publishers and genres that have at least one active book' })
  find(): Promise<Catalog> {
    return this.getCatalog.execute();
  }
}
