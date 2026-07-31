import { useSyncExternalStore } from 'react'

export function createPromiseHook<T>(
  createPromise: () => Promise<T>,
): () => T | undefined {
  // Cached state
  let cachedResult: T | undefined
  const listeners = new Set<() => void>()
  const promise = createPromise()

  // Listen to Promise completion
  promise
    .then((result) => {
      cachedResult = result
      const currentListeners = Array.from(listeners)
      listeners.clear()
      for (const listener of currentListeners) {
        listener()
      }
    })
    .catch((error) => {
      throw error
    })

  // Subscribe adds local listener to `Set`
  function subscribe(onStoreChange: () => void): () => void {
    if (cachedResult != null) {
      // We already have a cached result - no need to subscribe to anything
      return () => {}
    }
    listeners.add(onStoreChange)
    return () => {
      listeners.delete(onStoreChange)
    }
  }
  // Snapshot returns cached state
  function getSnapshot(): T | undefined {
    return cachedResult
  }

  // This is the actual hook
  return () => {
    return useSyncExternalStore(subscribe, getSnapshot)
  }
}
