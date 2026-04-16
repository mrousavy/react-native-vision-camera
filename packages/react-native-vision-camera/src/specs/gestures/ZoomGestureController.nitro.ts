import type { CameraController } from '../CameraController.nitro'
import type { GestureController } from './GestureController.nitro'

/**
 * A {@linkcode ZoomGestureController} is a {@linkcode GestureController}
 * that can modify a {@linkcode CameraController}'s
 * {@linkcode CameraController.zoom | zoom} via a
 * native pinch-to-zoom gesture.
 */
export interface ZoomGestureController extends GestureController {}
