import { Skia, type SkSurface } from '@shopify/react-native-skia'
import { getCurrentThreadMarker } from 'react-native-vision-camera-worklets'
import { createSynchronizable } from 'react-native-worklets'

interface SurfaceCache {
  cacheKey: number
  lastUsedTimestamp: number
  surface: SkSurface
}
// If a Surface hasn't been used in 15_000ms, it will be deleted from cache.
const MAXIMUM_SURFACE_CACHE_AGE_MS = 15_000
const surfacesCache = createSynchronizable<SurfaceCache[]>([])

/**
 * Clears the internal {@linkcode SkSurface} cache, disposing every cached
 * Surface.
 *
 * Surfaces are otherwise kept alive for up to 15 seconds of inactivity per
 * thread to avoid re-creating them on every Frame. Call this on teardown to
 * release GPU memory eagerly.
 *
 * @internal
 */
export function clearSurfacesCache() {
  surfacesCache.setBlocking((surfaces) => {
    for (const surface of surfaces) {
      surface.surface.dispose()
    }
    return []
  })
}

/**
 * Gets (or lazily creates) an offscreen {@linkcode SkSurface} of the given
 * {@linkcode width} and {@linkcode height} for the current thread.
 *
 * @discussion
 * Surfaces are cached per thread + size. Unused Surfaces are automatically
 * evicted from the cache after 15 seconds of inactivity.
 *
 * @internal
 * @worklet
 */
export function getSurface(width: number, height: number): SkSurface {
  'worklet'
  // The Thread ID is a `thread_local` counter. We use it as a cache key,
  // since graphic APIs typically use thread local cache. So keeping one
  // Surface per logical C++ thread is a safe way to make sure we don't
  // violate threading concerns.
  const threadId = getCurrentThreadMarker()
  const cachedSurfaces = surfacesCache.getBlocking()
  const now = performance.now()
  try {
    const cachedSurface = cachedSurfaces.find(
      (c) =>
        c.cacheKey === threadId &&
        c.surface.width() === width &&
        c.surface.height() === height,
    )
    if (cachedSurface != null) {
      // We found a Surface in our cache! Before we return it, set its last used timestamp to now.
      cachedSurface.lastUsedTimestamp = now
      return cachedSurface.surface
    }

    // We don't have a cached Surface - create one...
    const newSurface = Skia.Surface.MakeOffscreen(width, height)
    if (newSurface == null) {
      throw new Error(`Failed to create Skia Surface!`)
    }
    cachedSurfaces.push({
      cacheKey: threadId,
      surface: newSurface,
      lastUsedTimestamp: now,
    })

    // Return the new one
    return newSurface
  } finally {
    // Remove all cached Surfaces that haven't been used in >10 seconds
    let counter = 0
    while (counter <= cachedSurfaces.length) {
      const c = cachedSurfaces[counter]
      if (c == null) break
      const keep = now - c.lastUsedTimestamp <= MAXIMUM_SURFACE_CACHE_AGE_MS
      if (!keep) {
        // Remove this surface!
        c.surface.dispose()
        cachedSurfaces.splice(counter, 1)
        continue
      }
      counter++
    }
    // Write back any modifications in `cachedSurfaces` to our cache.
    surfacesCache.setBlocking(cachedSurfaces)
  }
}
