import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DESCRIPTION_MAX_LENGTH } from '../domain/genre';

/** Shape checks only; normalization lives in the domain. */
export class CreateGenreDto {
  @ApiProperty({ example: 'Poesía', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({
    example: 'Obras en verso y reflexiones líricas',
    nullable: true,
    maxLength: DESCRIPTION_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string | null;
}

/** Every field optional: omitted keeps the current value, null clears the description. */
export class UpdateGenreDto extends PartialType(CreateGenreDto) {}
