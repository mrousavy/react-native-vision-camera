import { useCallback, useRef, useSyncExternalStore } from 'react'
import type { CameraOrientation } from '../specs/common-types/CameraOrientation'
import type { OrientationSource } from '../specs/common-types/OrientationSource'
import { useOrientationManager } from './internal/useOrientationManager'

/**
 * Reactively use the current {@linkcode source} {@linkcode CameraOrientation}.
 * - {@linkcode OrientationSource | 'interface'} will listen to UI-orientation.
 * - {@linkcode OrientationSource | 'device'} will listen to physical phone orientation.
 * - `undefined` will return `undefined` and not listen to anything.
 */
export function useOrientation(
  source: OrientationSource | undefined,
): CameraOrientation | undefined {
  const orientationManager = useOrientationManager(source)
  const currentOrientation = useRef(orientationManager?.currentOrientation)

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (orientationManager == null) return () => {}

      orientationManager.startOrientationUpdates((orientation) => {
        currentOrientation.current = orientation
        onStoreChange()
      })
      return () => orientationManager.stopOrientationUpdates()
    },
    [orientationManager],
  )
  const getSnapshot = useCallback(() => currentOrientation.current, [])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
