import { useEffect, useMemo } from 'react'
import type {
  CameraController,
  CameraControllerConfiguration,
} from '../../specs/CameraController.nitro'

export function useCameraControllerConfiguration(
  controller: CameraController | undefined,
  config: CameraControllerConfiguration,
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

  useEffect(() => {
    if (controller == null) return
    if (Object.values(memoizedConfig).every((v) => v == null)) {
      // all props are null, we can skip the configuration.
      return
    }
    const load = async () => {
      await controller.configure(memoizedConfig)
    }
    load()
  }, [memoizedConfig, controller])
}
