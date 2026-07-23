import { useEffect } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { CameraController } from '../../specs/CameraController.nitro'
import { VisionCameraWorkletsProxy } from '../../third-party/VisionCameraWorkletsProxy'
import { useStableCallback } from './useStableCallback'

export function useExposureUpdater(
  controller: CameraController | undefined,
  exposure: number | SharedValue<number> | undefined,
  onError?: (error: Error) => void,
): void {
  const stableOnError = useStableCallback(onError ?? console.error)
  useEffect(() => {
    if (controller == null) return
    if (exposure == null) return

    // Fire-and-forget Promise - see the note in useZoomUpdater. Route
    // rejections to the user's onError instead of letting them surface as
    // unhandled Promise rejections.
    const applyExposure = (value: number) => {
      controller.setExposureBias(value).catch(stableOnError)
    }

    if (typeof exposure === 'number') {
      // number
      applyExposure(exposure)
      return
    } else {
      // SharedValue<number>
      applyExposure(exposure.get())
      const listener = VisionCameraWorkletsProxy.bindUIUpdatesToController(
        exposure,
        controller,
        'setExposureBias',
      )
      return () => listener.remove()
    }
  }, [controller, exposure, stableOnError])
}
