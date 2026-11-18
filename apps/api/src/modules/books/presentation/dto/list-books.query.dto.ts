import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { BookFiltersQueryDto } from './book-filters.query.dto';

export { BookFiltersQueryDto, SORT_PATTERN } from './book-filters.query.dto';

export const MAX_PAGE_SIZE = 100;

/** The list adds server-side pagination on top of the shared filters. */
export class ListBooksQueryDto extends BookFiltersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = 10;
}
