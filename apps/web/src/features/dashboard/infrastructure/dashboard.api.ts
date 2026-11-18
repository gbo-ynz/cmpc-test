import { unwrap, type Envelope } from '../../../shared/api/envelope';
import { httpClient } from '../../../shared/api/http-client';
import type { Dashboard, DashboardGateway } from '../domain/dashboard.types';

/** HTTP adapter implementing the DashboardGateway port (/api/dashboard). */
export const dashboardApi: DashboardGateway = {
  async get() {
    return unwrap(await httpClient.get<Envelope<Dashboard>>('/dashboard'));
  },
};
