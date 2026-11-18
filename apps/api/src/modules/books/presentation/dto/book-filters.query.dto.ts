import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { BOOK_SORT_FIELDS } from '../../domain/book-criteria';

export const SORT_PATTERN = /^[a-zA-Z]+:(asc|desc)(,[a-zA-Z]+:(asc|desc))*$/;

const BOOLEAN_STRINGS: Record<string, boolean> = { true: true, false: false };
const toBoolean = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? (BOOLEAN_STRINGS[value] ?? value) : value;

/** Filters and sort shared by the paginated list and the CSV export. */
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
