import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraController } from '../CameraController.nitro'
import type { PreviewView } from '../views/PreviewView.nitro'
import type { ZoomGestureController } from './ZoomGestureController.nitro'

/**
 * A {@linkcode GestureController} is a controller
 * that can control a {@linkcode CameraController}'s
 * property via a user gesture.
 *
 * For example, a {@linkcode ZoomGestureController}
 * uses a pinch gesture to modify the {@linkcode CameraController}'s
 * {@linkcode CameraController.zoom | zoom} property.
 *
 * The {@linkcode GestureController} needs to be attached
 * to a View (like a {@linkcode PreviewView}) to enable
 * the gesture.
 */
export interface GestureController
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Gets or sets the {@linkcode CameraController}
   * this {@linkcode GestureController} should
   * control.
   */
  controller: CameraController | undefined
}
