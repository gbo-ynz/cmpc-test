import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../shared/api/api-error';

const MAX_RETRIES = 2;
const STALE_TIME_MS = 30_000;

// Client errors (4xx) are deterministic: retrying them only adds latency.
const shouldRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < MAX_RETRIES && !(error instanceof ApiError && error.isClientError);

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: STALE_TIME_MS, retry: shouldRetry, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
