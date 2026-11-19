import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import { CurrentUser } from '../../auth/index';
import { GetDashboardUseCase } from '../application/get-dashboard.use-case';

/** Open to every signed-in user: the content depends on the profile (RF-09). */
@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly getDashboard: GetDashboardUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Main figures; administrators also get the administration section (`administration`)',
  })
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.getDashboard.execute(user.role);
  }
}
