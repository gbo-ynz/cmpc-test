import { usePageState } from '../../../shared/lib/usePageState';
import { usePublishersPage } from './publisher-hooks';

export const usePublishersPageState = () => usePageState(usePublishersPage);
