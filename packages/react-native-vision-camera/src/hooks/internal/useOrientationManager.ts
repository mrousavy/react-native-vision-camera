import { useMemo } from 'react'
import type { OrientationSource } from '../../specs/common-types/OrientationSource'
import type { OrientationManager } from '../../specs/orientation/OrientationManager.nitro'
import { VisionCamera } from '../../VisionCamera'

export function useOrientationManager(
  source: OrientationSource | undefined,
): OrientationManager | undefined {
  return useMemo(() => {
    if (source != null) {
      return VisionCamera.createOrientationManager(source)
    } else {
      return undefined
    }
  }, [source])
}
