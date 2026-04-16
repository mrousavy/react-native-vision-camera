import { useCallback, useRef } from 'react'

// biome-ignore lint/suspicious/noExplicitAny: This is the only way to model functions
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
): (...args: Parameters<T>) => ReturnType<T> {
  // Wrap callback in useRef
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  // Call the ref's current value in useCallback
  return useCallback((...params: Parameters<T>): ReturnType<T> => {
    return callbackRef.current(...params)
  }, [])
}
