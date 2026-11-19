import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import type { BookInput } from '../../application/book-input';
import { MAX_PRICE } from '../../domain/price';
import { BOOK_LIMITS } from '../../domain/book-data';

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

  @ApiProperty({
    example: 16990,
    minimum: 0,
    maximum: MAX_PRICE,
    description: 'Whole Chilean pesos (CLP)',
  })
  @IsInt({ message: 'price must be a whole number of pesos (CLP has no decimals)' })
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
