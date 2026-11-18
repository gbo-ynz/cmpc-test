import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from './public.decorator';

export interface HealthStatus {
  readonly status: 'ok';
  readonly database: 'up';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: 'Liveness + database connectivity probe' })
  async check(): Promise<HealthStatus> {
    await this.prisma.client.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'up' };
  }
}
