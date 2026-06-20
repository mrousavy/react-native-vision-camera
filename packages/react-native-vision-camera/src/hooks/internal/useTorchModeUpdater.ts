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

    // `setTorchMode` rejects if the device has no torch (e.g. front camera, or
    // many emulators), or if the session became inactive before the update
    // applied (e.g. during teardown). These are recoverable, so catch the
    // rejection here — otherwise it surfaces as an unhandled promise rejection.
    controller.setTorchMode(torchMode).catch((error) => {
      console.warn(`Failed to set torch mode to "${torchMode}":`, error)
    })
  }, [controller, torchMode])
}
