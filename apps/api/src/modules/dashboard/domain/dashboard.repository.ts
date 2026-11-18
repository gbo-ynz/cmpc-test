import type {
  ActivityEntry,
  BookStats,
  CatalogStats,
  GenreBookCount,
  SalesStats,
} from './dashboard';

/** Read-only port: every method is an aggregate, never a full table. */
export abstract class DashboardRepository {
  /** Active books, and how many of them have stock. */
  abstract bookStats(): Promise<BookStats>;
  /** Active books per genre, most books first; genres without active books are left out. */
  abstract booksByGenre(): Promise<GenreBookCount[]>;
  abstract salesStats(): Promise<SalesStats>;
  /** Sum of price x stock over the available books. */
  abstract inventoryValue(): Promise<number>;
  abstract catalogStats(): Promise<CatalogStats>;
  /** Newest first. */
  abstract recentActivity(limit: number): Promise<ActivityEntry[]>;
}
