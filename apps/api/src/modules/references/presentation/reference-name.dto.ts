import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Shape check only; the per-kind limit and normalization live in the domain. */
export class ReferenceNameDto {
  @ApiProperty({ example: 'Julio Cortázar', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;
}
