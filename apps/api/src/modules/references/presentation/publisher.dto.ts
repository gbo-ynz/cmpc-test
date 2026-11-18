import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { COUNTRY_MAX_LENGTH } from '../domain/publisher';

/** Shape checks only; normalization lives in the domain. */
export class CreatePublisherDto {
  @ApiProperty({ example: 'Sudamericana', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({ example: 'Argentina', nullable: true, maxLength: COUNTRY_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(COUNTRY_MAX_LENGTH)
  country?: string | null;
}

/** Every field optional: omitted keeps the current value, null clears the country. */
export class UpdatePublisherDto extends PartialType(CreatePublisherDto) {}
