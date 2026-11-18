import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { BIOGRAPHY_MAX_LENGTH } from '../domain/author';

/** Shape checks only; normalization, real-date and not-in-the-future rules live in the domain. */
export class CreateAuthorDto {
  @ApiProperty({ example: 'Gabriela Mistral', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({ example: '1889-04-07', nullable: true, description: 'YYYY-MM-DD' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'birthDate must use the YYYY-MM-DD format' })
  birthDate?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: BIOGRAPHY_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(BIOGRAPHY_MAX_LENGTH)
  biography?: string | null;
}

/** Every field optional: omitted keeps the current value, null clears a detail. */
export class UpdateAuthorDto extends PartialType(CreateAuthorDto) {}
