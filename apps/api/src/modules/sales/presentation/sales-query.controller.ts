import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DEFAULT_PAGE_SIZE } from '../../references/presentation/page.query.dto';
import { GetSaleUseCase, ListSalesPageUseCase } from '../application/sale-queries.use-case';
import { ListSalesQueryDto } from './sale.dto';

/** Open to every authenticated user (administrators and regular users both sell). */
@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesQueryController {
  constructor(
    private readonly listSales: ListSalesPageUseCase,
    private readonly getSale: GetSaleUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Sales newest first, paginated on the server, filterable by status' })
  list(@Query() { page = 1, limit = DEFAULT_PAGE_SIZE, status }: ListSalesQueryDto) {
    return this.listSales.execute({ page, limit }, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One sale with its lines' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getSale.execute(id);
  }
}
