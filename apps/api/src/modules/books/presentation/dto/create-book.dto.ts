import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';
import { BOOK_LIMITS, BookData } from '../../domain/book-data';

const MAX_PRICE = 9_999_999_999.99;

export class CreateBookDto implements BookData {
  @ApiProperty({ example: 'Rayuela', maxLength: BOOK_LIMITS.title })
  @IsString()
  @IsNotEmpty()
  @MaxLength(BOOK_LIMITS.title)
  title: string;

  @ApiProperty({ example: 'Julio Cortázar', maxLength: BOOK_LIMITS.author })
  @IsString()
  @IsNotEmpty()
  @MaxLength(BOOK_LIMITS.author)
  author: string;

  @ApiProperty({ example: 'Sudamericana', maxLength: BOOK_LIMITS.publisher })
  @IsString()
  @IsNotEmpty()
  @MaxLength(BOOK_LIMITS.publisher)
  publisher: string;

  @ApiProperty({ example: 'Novela', maxLength: BOOK_LIMITS.genre })
  @IsString()
  @IsNotEmpty()
  @MaxLength(BOOK_LIMITS.genre)
  genre: string;

  @ApiProperty({ example: 16990, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_PRICE)
  price: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable: boolean;
}
