import { useEffect } from 'react'
import type { CameraController } from '../../specs/CameraController.nitro'
import type { TorchMode } from '../../specs/common-types/TorchMode'
import { ignoreCameraCancellation } from './ignoreCameraCancellation'

export function useTorchModeUpdater(
  controller: CameraController | undefined,
  torchMode: TorchMode | undefined,
): void {
  useEffect(() => {
    if (controller == null) return
    if (torchMode == null) return

    ignoreCameraCancellation(controller.setTorchMode(torchMode))
  }, [controller, torchMode])
}
