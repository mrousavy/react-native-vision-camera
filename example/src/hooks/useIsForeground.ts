import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useCachedState } from './useCachedState';

export const useIsForeground = (): boolean => {
  const [isForeground, setIsForeground] = useCachedState(true);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      setIsForeground(state === 'active');
    };
    AppState.addEventListener('change', onChange);
    return () => AppState.removeEventListener('change', onChange);
  }, [setIsForeground]);

  return isForeground;
};
