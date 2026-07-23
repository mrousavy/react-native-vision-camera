import { useEffect } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { CameraController } from '../../specs/CameraController.nitro'
import { VisionCameraWorkletsProxy } from '../../third-party/VisionCameraWorkletsProxy'
import { useStableCallback } from './useStableCallback'

export function useZoomUpdater(
  controller: CameraController | undefined,
  zoom: number | SharedValue<number> | undefined,
  onError?: (error: Error) => void,
): void {
  const stableOnError = useStableCallback(onError ?? console.error)
  useEffect(() => {
    if (controller == null) return
    if (zoom == null) return

    // setZoom returns a Promise which is fired-and-forgotten here. It can
    // reject under recoverable conditions - e.g. CameraX rejects with
    // OperationCanceledException ("Camera is not active") when this effect
    // re-runs against a freshly re-configured, not-yet-streaming session.
    // Route the rejection to the user's onError instead of letting it
    // surface as an unhandled Promise rejection.
    const applyZoom = (value: number) => {
      controller.setZoom(value).catch(stableOnError)
    }

    if (typeof zoom === 'number') {
      // number
      applyZoom(zoom)
      return
    } else {
      // SharedValue<number>
      applyZoom(zoom.get())
      const listener = VisionCameraWorkletsProxy.bindUIUpdatesToController(
        zoom,
        controller,
        'setZoom',
      )
      return () => listener.remove()
    }
  }, [controller, zoom, stableOnError])
}
