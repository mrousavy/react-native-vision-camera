import { useState } from 'react';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useIsForeground = (): boolean => {
  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    const onChange = (state: AppStateStatus): void => {
      setIsForeground(state === 'active');
    };
    AppState.addEventListener('change', onChange);
    return () => AppState.removeEventListener('change', onChange);
  }, [setIsForeground]);

  return isForeground;
};
