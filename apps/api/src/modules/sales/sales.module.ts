import { Module } from '@nestjs/common';
import { CancelSaleUseCase } from './application/cancel-sale.use-case';
import { CompleteSaleUseCase } from './application/complete-sale.use-case';
import { CreateSaleUseCase } from './application/create-sale.use-case';
import { GetSaleUseCase, ListSalesPageUseCase } from './application/sale-queries.use-case';
import { SaleStock } from './domain/sale-stock';
import { SaleRepository } from './domain/sale.repository';
import { PrismaSaleStock } from './infrastructure/persistence/prisma-sale-stock';
import { PrismaSaleRepository } from './infrastructure/persistence/prisma-sale.repository';
import { SalesQueryController } from './presentation/sales-query.controller';
import { SalesController } from './presentation/sales.controller';

/** Sales (RF-16 and RF-17): created pending, completed (discounts stock) or cancelled. */
@Module({
  controllers: [SalesQueryController, SalesController],
  providers: [
    ListSalesPageUseCase,
    GetSaleUseCase,
    CreateSaleUseCase,
    CompleteSaleUseCase,
    CancelSaleUseCase,
    { provide: SaleRepository, useClass: PrismaSaleRepository },
    { provide: SaleStock, useClass: PrismaSaleStock },
  ],
})
export class SalesModule {}
