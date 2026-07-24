import { useEffect } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { CameraController } from '../../specs/CameraController.nitro'
import { VisionCameraWorkletsProxy } from '../../third-party/VisionCameraWorkletsProxy'
import { ignoreCameraCancellation } from './ignoreCameraCancellation'

export function useZoomUpdater(
  controller: CameraController | undefined,
  zoom: number | SharedValue<number> | undefined,
): void {
  useEffect(() => {
    if (controller == null) return
    if (zoom == null) return

    if (typeof zoom === 'number') {
      // number
      ignoreCameraCancellation(controller.setZoom(zoom))
      return
    } else {
      // SharedValue<number>
      ignoreCameraCancellation(controller.setZoom(zoom.get()))
      const listener = VisionCameraWorkletsProxy.bindUIUpdatesToController(
        zoom,
        controller,
        'setZoom',
      )
      return () => listener.remove()
    }
  }, [controller, zoom])
}
