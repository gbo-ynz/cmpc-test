import type { Page } from '../../../shared/api/envelope';

export interface Publisher {
  readonly id: string;
  readonly name: string;
  readonly country: string | null;
}

export interface PublisherSummary extends Publisher {
  readonly activeBooks: number;
}

export interface PublisherInput {
  readonly name: string;
  readonly country: string | null;
}

export interface PublisherPageParams {
  readonly page: number;
  readonly limit: number;
}

/** Port: the UI depends on this contract, not on axios. Deleting uses the shared catalog port. */
export interface PublishersGateway {
  /** One server-side page (select options go through the shared catalog port). */
  listPage(params: PublisherPageParams): Promise<Page<PublisherSummary>>;
  get(id: string): Promise<Publisher>;
  create(input: PublisherInput): Promise<Publisher>;
  update(id: string, input: PublisherInput): Promise<Publisher>;
}
