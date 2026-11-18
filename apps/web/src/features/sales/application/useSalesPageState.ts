import { useState } from 'react';
import { usePageState } from '../../../shared/lib/usePageState';
import type { SaleStatus } from '../domain/sale.types';
import { useSalesPage } from './sale-hooks';

/** Page and size come from usePageState; the status filter lives here and resets the page. */
export function useSalesPageState() {
  const [status, setStatus] = useState<SaleStatus | ''>('');
  const state = usePageState(useSalesPage, status === '' ? undefined : { status });

  const changeStatus = (next: SaleStatus | '') => {
    setStatus(next);
    state.setPage(1);
  };

  return { ...state, status, changeStatus };
}
