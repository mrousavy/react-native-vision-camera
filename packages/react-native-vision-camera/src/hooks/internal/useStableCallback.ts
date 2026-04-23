import { useCallback, useRef } from 'react'

/**
 * Returns a wrapper with a stable identity that always calls the latest
 * {@linkcode callback}. Re-renders that change only the {@linkcode callback}
 * reference do not change the returned identity.
 *
 * When {@linkcode callback} is `undefined` or `null`, the hook returns
 * that same nullish value. The returned identity therefore only changes
 * when {@linkcode callback} flips between "defined" and "nullish" — not
 * when the function itself changes — which makes it safe as a
 * `useEffect`/`useLayoutEffect` dependency.
 */
export function useStableCallback<T>(callback: T): T {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const stable = useCallback((...args: unknown[]): unknown => {
    const fn = callbackRef.current
    if (typeof fn !== 'function') {
      throw new Error(
        'useStableCallback: wrapped callback was invoked but the underlying callback is not a function. ' +
          'The hook returns the nullish value directly when the input is null/undefined, so callers ' +
          'should not hold a reference to the wrapper in that state.',
      )
    }
    return fn(...args)
  }, []) as T

  if (callback == null) return callback
  return stable
}
