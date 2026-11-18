import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { BookInput } from '../../application/book-input';
import { BOOK_LIMITS } from '../../domain/book-data';

const MAX_PRICE = 9_999_999_999.99;

export class CreateBookDto implements BookInput {
  @ApiProperty({ example: 'Rayuela', maxLength: BOOK_LIMITS.title })
  @IsString()
  @IsNotEmpty()
  @MaxLength(BOOK_LIMITS.title)
  title: string;

  @ApiProperty({ format: 'uuid', description: 'An existing author (GET /api/authors)' })
  @IsUUID()
  authorId: string;

  @ApiProperty({ format: 'uuid', description: 'An existing publisher (GET /api/publishers)' })
  @IsUUID()
  publisherId: string;

  @ApiProperty({ format: 'uuid', description: 'An existing genre (GET /api/genres)' })
  @IsUUID()
  genreId: string;

  @ApiProperty({ example: 16990, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_PRICE)
  price: number;

  @ApiProperty({
    example: 5,
    minimum: 0,
    maximum: BOOK_LIMITS.stock,
    description: 'Units in stock',
  })
  @IsInt()
  @Min(0)
  @Max(BOOK_LIMITS.stock)
  stock: number;
}
