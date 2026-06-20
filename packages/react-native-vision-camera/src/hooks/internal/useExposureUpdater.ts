import { useEffect } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { CameraController } from '../../specs/CameraController.nitro'
import { VisionCameraWorkletsProxy } from '../../third-party/VisionCameraWorkletsProxy'

export function useExposureUpdater(
  controller: CameraController | undefined,
  exposure: number | SharedValue<number> | undefined,
): void {
  useEffect(() => {
    if (controller == null) return
    if (exposure == null) return

    // `setExposureBias` rejects if the session became inactive before the
    // update applied (e.g. during teardown). This is recoverable, so catch the
    // rejection here — otherwise it surfaces as an unhandled promise rejection.
    const onExposureError = (error: unknown): void => {
      console.warn('Failed to set exposure bias:', error)
    }

    if (typeof exposure === 'number') {
      // number
      controller.setExposureBias(exposure).catch(onExposureError)
      return
    } else {
      // SharedValue<number>
      controller.setExposureBias(exposure.get()).catch(onExposureError)
      const listener = VisionCameraWorkletsProxy.bindUIUpdatesToController(
        exposure,
        controller,
        'setExposureBias',
      )
      return () => listener.remove()
    }
  }, [controller, exposure])
}
