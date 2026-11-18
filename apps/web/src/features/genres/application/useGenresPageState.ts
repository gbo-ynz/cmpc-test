import { usePageState } from '../../../shared/lib/usePageState';
import { useGenresPage } from './genre-hooks';

export const useGenresPageState = () => usePageState(useGenresPage);
