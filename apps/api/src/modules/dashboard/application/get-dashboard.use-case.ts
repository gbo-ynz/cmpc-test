import { Injectable } from '@nestjs/common';
import type { UserRole } from '../../../shared/domain/authenticated-user';
import { RECENT_ACTIVITY_LIMIT, type Dashboard } from '../domain/dashboard';
import { DashboardRepository } from '../domain/dashboard.repository';

/**
 * The profile decides what is even queried: a regular user's request never reads the inventory
 * value, the administration counters or the audit trail.
 */
@Injectable()
export class GetDashboardUseCase {
  constructor(private readonly dashboard: DashboardRepository) {}

  async execute(role: UserRole): Promise<Dashboard> {
    const [books, booksByGenre, sales] = await Promise.all([
      this.dashboard.bookStats(),
      this.dashboard.booksByGenre(),
      this.dashboard.salesStats(),
    ]);
    const operation = { books, booksByGenre, sales };
    if (role !== 'ADMIN') return operation;

    const [inventoryValue, catalog, recentActivity] = await Promise.all([
      this.dashboard.inventoryValue(),
      this.dashboard.catalogStats(),
      this.dashboard.recentActivity(RECENT_ACTIVITY_LIMIT),
    ]);
    return { ...operation, administration: { inventoryValue, catalog, recentActivity } };
  }
}
