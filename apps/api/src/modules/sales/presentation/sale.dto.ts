import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PageQueryDto } from '../../references/presentation/page.query.dto';
import {
  PAYMENT_METHODS,
  SALE_STATUSES,
  type PaymentMethod,
  type SaleStatus,
} from '../domain/sale';

export const MAX_LINES = 50;
export const MAX_QUANTITY = 10_000;

export class SaleLineDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  bookId: string;

  @ApiProperty({ minimum: 1, maximum: MAX_QUANTITY })
  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY)
  quantity: number;
}

/** Shape checks only; active books, duplicates and stock are domain rules. */
export class CreateSaleDto {
  @ApiProperty({ type: [SaleLineDto], minItems: 1, maxItems: MAX_LINES })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LINES)
  @ValidateNested({ each: true })
  @Type(() => SaleLineDto)
  items: SaleLineDto[];
}

export class CompleteSaleDto {
  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsIn(PAYMENT_METHODS)
  paymentMethod: PaymentMethod;
}

export class ListSalesQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: SALE_STATUSES })
  @IsOptional()
  @IsIn(SALE_STATUSES)
  status?: SaleStatus;
}
