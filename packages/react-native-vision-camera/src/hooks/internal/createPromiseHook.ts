import { useSyncExternalStore } from 'react'

export function createPromiseHook<T>(
  createPromise: () => Promise<T>,
): () => T | undefined {
  let cachedResult: T | undefined
  const promise = createPromise()
  promise
    .then((result) => {
      cachedResult = result
    })
    .catch((error) => {
      throw error
    })

  function subscribe(onStoreChange: () => void): () => void {
    if (cachedResult != null) {
      // We already have a cached result - no need to subscribe to anything
      return () => {}
    }
    promise.then((result) => {
      cachedResult = result
      onStoreChange()
    })
    return () => {}
  }
  function getSnapshot(): T | undefined {
    return cachedResult
  }

  // This is the actual hook
  return () => {
    return useSyncExternalStore(subscribe, getSnapshot)
  }
}
