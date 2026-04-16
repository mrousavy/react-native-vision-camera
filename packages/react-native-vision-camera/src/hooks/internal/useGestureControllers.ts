import { useEffect, useMemo } from 'react'
import type { CameraController } from '../../specs/CameraController.nitro'
import type { GestureController } from '../../specs/gestures/GestureController.nitro'
import { VisionCamera } from '../../VisionCamera'

interface Props {
  controller: CameraController | undefined
  enableNativeTapToFocusGesture: boolean
  enableNativeZoomGesture: boolean
}

export function useGestureControllers({
  controller,
  enableNativeTapToFocusGesture,
  enableNativeZoomGesture,
}: Props): GestureController[] {
  // Build a memoized `GestureController` array of all enabled controllers
  const gestureControllers = useMemo<GestureController[]>(() => {
    const result: GestureController[] = []
    // Single tap gestures need to appear before any multi-tap gestures.
    if (enableNativeTapToFocusGesture) {
      result.push(VisionCamera.createTapToFocusGestureController())
    }
    if (enableNativeZoomGesture) {
      result.push(VisionCamera.createZoomGestureController())
    }
    return result
  }, [enableNativeTapToFocusGesture, enableNativeZoomGesture])

  // Update their `CameraController` individually
  useEffect(() => {
    for (const gestureController of gestureControllers) {
      gestureController.controller = controller
    }
  }, [controller, gestureControllers])

  // return it
  return gestureControllers
}
