import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { AUDIT_ACTIONS, type AuditAction } from '../../../shared/application/audit-logger.port';
import { PageQueryDto } from '../../../shared/infrastructure/http/page.query.dto';

const MAX_REFERENCE_LENGTH = 60;

export class ListAuditLogsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: AUDIT_ACTIONS })
  @IsOptional()
  @IsIn(AUDIT_ACTIONS)
  action?: AuditAction;

  @ApiPropertyOptional({ example: 'Book', description: 'Entity kind: Book, Author, Sale...' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_REFERENCE_LENGTH)
  entityType?: string;

  @ApiPropertyOptional({ description: 'Id of the affected record' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_REFERENCE_LENGTH)
  entityId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Who did it' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Inclusive' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Inclusive' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
