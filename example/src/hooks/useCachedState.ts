import { useCallback, useRef, useState } from 'react';

/**
 * Same as `useState`, but swallow all calls to `setState` if the value didn't change (uses `===` comparator per default)
 * @param initialValue The initial state
 * @param comparator A custom comparator, useful if you want to only round numbers or use string locale for comparison. Make sure this function is memoized!
 */
export const useCachedState = <T>(initialValue: T, comparator?: (oldState: T, newState: T) => boolean): [T, (newState: T) => void] => {
  const [state, setState] = useState(initialValue);
  const cachedState = useRef(initialValue);

  const dispatchState = useCallback(
    (newState: T) => {
      const areEqual = comparator == null ? cachedState.current === newState : comparator(cachedState.current, newState);
      if (areEqual) {
        return;
      } else {
        cachedState.current = newState;
        setState(newState);
      }
    },
    [comparator],
  );

  return [state, dispatchState];
};
