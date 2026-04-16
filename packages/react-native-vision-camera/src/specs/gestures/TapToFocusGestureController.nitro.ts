import type { CameraController } from '../CameraController.nitro'
import type { GestureController } from './GestureController.nitro'

/**
 * A {@linkcode TapToFocusGestureController} is a {@linkcode GestureController}
 * that can trigger a {@linkcode CameraController}'s
 * {@linkcode CameraController.focusTo | focusTo(...)}
 * action via a native tap to focus gesture.
 */
export interface TapToFocusGestureController extends GestureController {}
