export interface BookStats {
  readonly active: number;
  readonly available: number;
  readonly unavailable: number;
}

export interface GenreBookCount {
  readonly genre: string;
  readonly books: number;
}

export interface SalesStats {
  readonly pending: number;
  readonly completed: number;
  readonly completedAmount: number;
}

export interface CatalogStats {
  readonly authors: number;
  readonly publishers: number;
  readonly genres: number;
  readonly users: number;
}

/** One audit row as the dashboard shows it; `label` is the title, name or email when known. */
export interface ActivityEntry {
  readonly action: string;
  readonly entityType: string;
  readonly label: string | null;
  readonly actorName: string | null;
  readonly createdAt: Date;
}

/** What every signed-in user sees: the day-to-day operation. */
export interface OperationDashboard {
  readonly books: BookStats;
  readonly booksByGenre: readonly GenreBookCount[];
  readonly sales: SalesStats;
}

/** Only administrators: money, administration counters and the audit trail. */
export interface AdministrationDashboard {
  readonly inventoryValue: number;
  readonly catalog: CatalogStats;
  readonly recentActivity: readonly ActivityEntry[];
}

export interface Dashboard extends OperationDashboard {
  /** Absent for regular users: the API never sends it, the screen does not just hide it. */
  readonly administration?: AdministrationDashboard;
}

export const RECENT_ACTIVITY_LIMIT = 10;
