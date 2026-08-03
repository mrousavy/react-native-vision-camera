import { useEffect, useMemo } from 'react'
import type {
  CameraController,
  CameraControllerConfiguration,
} from '../../specs/CameraController.nitro'
import { useStableCallback } from './useStableCallback'

export function useCameraControllerConfiguration(
  controller: CameraController | undefined,
  config: CameraControllerConfiguration,
  onError: (error: Error) => void,
): void {
  const memoizedConfig = useMemo<CameraControllerConfiguration>(
    () => ({
      enableDistortionCorrection: config.enableDistortionCorrection,
      enableLowLightBoost: config.enableLowLightBoost,
      enableSmoothAutoFocus: config.enableSmoothAutoFocus,
    }),
    [
      config.enableDistortionCorrection,
      config.enableLowLightBoost,
      config.enableSmoothAutoFocus,
    ],
  )
  const stableOnError = useStableCallback(onError)

  useEffect(() => {
    if (controller == null) return
    if (Object.values(memoizedConfig).every((v) => v == null)) {
      // all props are null, we can skip the configuration.
      return
    }
    const load = async () => {
      try {
        await controller.configure(memoizedConfig)
      } catch (error) {
        stableOnError(error as Error)
      }
    }
    load()
  }, [memoizedConfig, controller, stableOnError])
}
