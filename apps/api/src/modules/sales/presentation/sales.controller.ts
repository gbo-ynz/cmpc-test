import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import { CurrentUser } from '../../../shared/infrastructure/http/current-user.decorator';
import { CancelSaleUseCase } from '../application/cancel-sale.use-case';
import { CompleteSaleUseCase } from '../application/complete-sale.use-case';
import { CreateSaleUseCase } from '../application/create-sale.use-case';
import { CompleteSaleDto, CreateSaleDto } from './sale.dto';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(
    private readonly createSale: CreateSaleUseCase,
    private readonly completeSale: CompleteSaleUseCase,
    private readonly cancelSale: CancelSaleUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a pending sale (400 for inactive books, repeats or no stock)' })
  create(@Body() dto: CreateSaleDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.createSale.execute({ items: dto.items, actorId: actor.id });
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete: discounts the stock atomically (409 if it cannot)' })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteSaleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.completeSale.execute({ id, paymentMethod: dto.paymentMethod, actorId: actor.id });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending sale; the stock is not modified' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.cancelSale.execute({ id, actorId: actor.id });
  }
}
