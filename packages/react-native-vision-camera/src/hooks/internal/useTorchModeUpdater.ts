import { useEffect } from 'react'
import type { CameraController } from '../../specs/CameraController.nitro'
import type { TorchMode } from '../../specs/common-types/TorchMode'

export function useTorchModeUpdater(
  controller: CameraController | undefined,
  torchMode: TorchMode | undefined,
): void {
  useEffect(() => {
    if (controller == null) return
    if (torchMode == null) return

    controller.setTorchMode(torchMode)
  }, [controller, torchMode])
}
