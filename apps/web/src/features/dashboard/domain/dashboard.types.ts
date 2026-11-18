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

export interface ActivityEntry {
  readonly action: string;
  readonly entityType: string;
  readonly label: string | null;
  readonly actorName: string | null;
  readonly createdAt: string;
}

/** Only administrators receive this section: the API leaves it out for everyone else. */
export interface AdministrationDashboard {
  readonly inventoryValue: number;
  readonly catalog: CatalogStats;
  readonly recentActivity: readonly ActivityEntry[];
}

export interface Dashboard {
  readonly books: BookStats;
  readonly booksByGenre: readonly GenreBookCount[];
  readonly sales: SalesStats;
  readonly administration?: AdministrationDashboard;
}

/** Port: the UI depends on this contract, not on axios. */
export interface DashboardGateway {
  get(): Promise<Dashboard>;
}
