import { useEffect } from 'react'
import type { CameraController } from '../../specs/CameraController.nitro'
import type { TorchMode } from '../../specs/common-types/TorchMode'
import { useStableCallback } from './useStableCallback'

export function useTorchModeUpdater(
  controller: CameraController | undefined,
  torchMode: TorchMode | undefined,
  onError?: (error: Error) => void,
): void {
  const stableOnError = useStableCallback(onError ?? console.error)
  useEffect(() => {
    if (controller == null) return
    if (torchMode == null) return

    // Fire-and-forget Promise - see the note in useZoomUpdater. Also rejects
    // with "No flash unit" on devices/lenses without a torch. Route
    // rejections to the user's onError instead of letting them surface as
    // unhandled Promise rejections.
    controller.setTorchMode(torchMode).catch(stableOnError)
  }, [controller, torchMode, stableOnError])
}
