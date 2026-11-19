import type {
  ActivityEntry,
  BookStats,
  CatalogStats,
  GenreBookCount,
  SalesStats,
} from '../modules/dashboard/domain/dashboard';
import { DashboardRepository } from '../modules/dashboard/domain/dashboard.repository';

const ENTRY: ActivityEntry = {
  action: 'CREATE',
  entityType: 'Book',
  label: 'Rayuela',
  actorName: 'Admin',
  createdAt: new Date('2026-03-10T12:00:00Z'),
};

/** Fixed figures plus a log of what was asked, to prove what a profile never queries. */
export class FakeDashboardRepository extends DashboardRepository {
  readonly calls: string[] = [];

  async bookStats(): Promise<BookStats> {
    this.calls.push('bookStats');
    return { active: 5, available: 3, unavailable: 2 };
  }

  async booksByGenre(): Promise<GenreBookCount[]> {
    this.calls.push('booksByGenre');
    return [{ genre: 'Novela', books: 4 }];
  }

  async salesStats(): Promise<SalesStats> {
    this.calls.push('salesStats');
    return { pending: 2, completed: 7, completedAmount: 123500 };
  }

  async inventoryValue(): Promise<number> {
    this.calls.push('inventoryValue');
    return 987650;
  }

  async catalogStats(): Promise<CatalogStats> {
    this.calls.push('catalogStats');
    return { authors: 8, publishers: 6, genres: 4, users: 3 };
  }

  async recentActivity(limit: number): Promise<ActivityEntry[]> {
    this.calls.push(`recentActivity:${limit}`);
    return [ENTRY];
  }
}
