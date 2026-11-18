import { usePageState } from '../../../shared/lib/usePageState';
import { useAuthorsPage } from './author-hooks';

export const useAuthorsPageState = () => usePageState(useAuthorsPage);
