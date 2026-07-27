import { useEffect } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { CameraController } from '../../specs/CameraController.nitro'
import { VisionCameraWorkletsProxy } from '../../third-party/VisionCameraWorkletsProxy'
import { useStableCallback } from './useStableCallback'

export function useExposureUpdater(
  controller: CameraController | undefined,
  exposure: number | SharedValue<number> | undefined,
  onError: (error: Error) => void,
): void {
  const stableOnError = useStableCallback(onError)

  useEffect(() => {
    if (controller == null) return
    if (exposure == null) return

    if (typeof exposure === 'number') {
      // number
      controller.setExposureBias(exposure).catch(stableOnError)
      return
    } else {
      // SharedValue<number>
      controller.setExposureBias(exposure.get()).catch(stableOnError)
      const listener = VisionCameraWorkletsProxy.bindUIUpdatesToController(
        exposure,
        controller,
        'setExposureBias',
      )
      return () => listener.remove()
    }
  }, [controller, exposure, stableOnError])
}
