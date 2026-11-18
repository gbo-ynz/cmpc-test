import { Injectable } from '@nestjs/common';
import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { Sale, SaleStatus, SaleSummary } from '../domain/sale';
import { SaleRepository } from '../domain/sale.repository';
import { requireSale } from './sale-commands';

@Injectable()
export class ListSalesPageUseCase {
  constructor(private readonly sales: SaleRepository) {}

  execute(request: PageRequest, status?: SaleStatus): Promise<Paginated<SaleSummary>> {
    return this.sales.listPage(request, status);
  }
}

@Injectable()
export class GetSaleUseCase {
  constructor(private readonly sales: SaleRepository) {}

  execute(id: string): Promise<Sale> {
    return requireSale(this.sales, id);
  }
}
