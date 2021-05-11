import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigation } from 'react-native-navigation';

export const useIsScreenFocussed = (componentId: string): boolean => {
  const componentStack = useRef<string[]>(['componentId']);
  const [isFocussed, setIsFocussed] = useState(true);

  const invalidate = useCallback(() => {
    const last = componentStack.current[componentStack.current.length - 1];
    setIsFocussed(last === componentId);
  }, [componentId, setIsFocussed]);

  useEffect(() => {
    const listener = Navigation.events().registerComponentDidAppearListener((event) => {
      if (event.componentType !== 'Component') return;
      componentStack.current.push(event.componentId);
      invalidate();
    });

    return () => listener.remove();
  }, [invalidate]);
  useEffect(() => {
    const listener = Navigation.events().registerComponentDidDisappearListener((event) => {
      if (event.componentType !== 'Component') return;
      // we can't simply use .pop() here because the component might be popped deeper down in the hierarchy.
      for (let i = componentStack.current.length - 1; i >= 0; i--) {
        if (componentStack.current[i] === event.componentId) {
          componentStack.current.splice(i, 1);
          break;
        }
      }
      invalidate();
    });

    return () => listener.remove();
  }, [invalidate]);

  return isFocussed;
};
