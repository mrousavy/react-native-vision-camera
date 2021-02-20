import { useEffect, useMemo, useReducer } from 'react';
import { Navigation } from 'react-native-navigation';

type Action =
  | {
      action: 'push';
      componentId: string;
    }
  | {
      action: 'pop';
      componentId: string;
    };

const reducer = (stack: string[], action: Action): string[] => {
  switch (action.action) {
    case 'push': {
      stack.push(action.componentId);
      break;
    }
    case 'pop': {
      const index = stack.indexOf(action.componentId);
      if (index > -1) stack.splice(index, 1);
      break;
    }
  }
  return [...stack];
};

export const useIsScreenFocused = (componentId: string): boolean => {
  const [componentStack, dispatch] = useReducer(reducer, [componentId]);
  const isFocussed = useMemo(() => componentStack[componentStack.length - 1] === componentId, [componentStack, componentId]);

  useEffect(() => {
    const listener = Navigation.events().registerComponentDidAppearListener((event) => {
      if (event.componentType !== 'Component') return;
      dispatch({
        action: 'push',
        componentId: event.componentId,
      });
    });

    return () => listener.remove();
  }, []);
  useEffect(() => {
    const listener = Navigation.events().registerComponentDidDisappearListener((event) => {
      if (event.componentType !== 'Component') return;
      dispatch({
        action: 'pop',
        componentId: event.componentId,
      });
    });

    return () => listener.remove();
  }, []);

  return isFocussed;
};
