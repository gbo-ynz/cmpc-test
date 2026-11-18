import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BOOK_SORT_FIELDS } from '../../domain/book-criteria';

export const MAX_PAGE_SIZE = 100;
export const SORT_PATTERN = /^[a-zA-Z]+:(asc|desc)(,[a-zA-Z]+:(asc|desc))*$/;

const BOOLEAN_STRINGS: Record<string, boolean> = { true: true, false: false };
const toBoolean = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? (BOOLEAN_STRINGS[value] ?? value) : value;

export class BookFiltersQueryDto {
  @ApiPropertyOptional({ description: 'Searches title, author and publisher' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  genreId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  publisherId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    example: 'title:asc,price:desc',
    description: `Comma separated field:direction. Fields: ${BOOK_SORT_FIELDS.join(', ')}`,
  })
  @IsOptional()
  @Matches(SORT_PATTERN)
  sort?: string;
}

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
