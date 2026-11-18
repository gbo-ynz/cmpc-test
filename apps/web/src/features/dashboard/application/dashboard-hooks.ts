import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../infrastructure/dashboard.api';

export const dashboardKeys = { all: ['dashboard'] as const };

/** The figures change with every sale or book: always ask again when the screen opens. */
export const useDashboard = () =>
  useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => dashboardApi.get(),
    staleTime: 0,
    refetchOnMount: 'always',
  });
