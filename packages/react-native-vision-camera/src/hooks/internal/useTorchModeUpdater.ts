import { useEffect } from 'react'
import type { CameraController } from '../../specs/CameraController.nitro'
import type { TorchMode } from '../../specs/common-types/TorchMode'
import { useStableCallback } from './useStableCallback'

export function useTorchModeUpdater(
  controller: CameraController | undefined,
  torchMode: TorchMode | undefined,
  onError: (error: Error) => void,
): void {
  const stableOnError = useStableCallback(onError)

  useEffect(() => {
    if (controller == null) return
    if (torchMode == null) return

    controller.setTorchMode(torchMode).catch(stableOnError)
  }, [controller, torchMode, stableOnError])
}
