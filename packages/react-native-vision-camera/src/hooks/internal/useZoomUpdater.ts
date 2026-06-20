import { useEffect } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { CameraController } from '../../specs/CameraController.nitro'
import { VisionCameraWorkletsProxy } from '../../third-party/VisionCameraWorkletsProxy'

export function useZoomUpdater(
  controller: CameraController | undefined,
  zoom: number | SharedValue<number> | undefined,
): void {
  useEffect(() => {
    if (controller == null) return
    if (zoom == null) return

    // `setZoom` rejects if the session became inactive before the update
    // applied (e.g. during teardown), throwing `OperationCanceledException:
    // Camera is not active`. This is recoverable, so catch the rejection here —
    // otherwise it surfaces as an unhandled promise rejection.
    const onZoomError = (error: unknown): void => {
      console.warn('Failed to set zoom:', error)
    }

    if (typeof zoom === 'number') {
      // number
      controller.setZoom(zoom).catch(onZoomError)
      return
    } else {
      // SharedValue<number>
      controller.setZoom(zoom.get()).catch(onZoomError)
      const listener = VisionCameraWorkletsProxy.bindUIUpdatesToController(
        zoom,
        controller,
        'setZoom',
      )
      return () => listener.remove()
    }
  }, [controller, zoom])
}
