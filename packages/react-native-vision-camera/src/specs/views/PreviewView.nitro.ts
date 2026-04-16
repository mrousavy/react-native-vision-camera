import type { Image } from 'react-native-nitro-image'
import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules'
import type { Camera } from '../../views/Camera'
import type { NativePreviewView } from '../../views/NativePreviewView'
import type { CameraController } from '../CameraController.nitro'
import type { Point } from '../common-types/Point'
import type { GestureController } from '../gestures/GestureController.nitro'
import type { ZoomGestureController } from '../gestures/ZoomGestureController.nitro'
import type { ScannedObject } from '../instances/ScannedObject.nitro'
import type { MeteringPoint } from '../metering/MeteringPoint.nitro'
import type { CameraPreviewOutput } from '../outputs/CameraPreviewOutput.nitro'
import type { CameraSession } from '../session/CameraSession.nitro'

/**
 * Represents the implementation mode for the {@linkcode PreviewView}'s
 * surface on Android.
 * - `'performance'`: Uses [`SurfaceView`](https://developer.android.com/reference/android/view/SurfaceView) for better GPU-accelerated performance.
 * - `'compatible'`: Uses [`TextureView`](https://developer.android.com/reference/android/view/TextureView) for better compatibility and transforms support.
 *
 * @note `'performance'` does not support transparency or view layering.
 * @see See [CameraX: `PreviewView.setImplementationMode(...)`](https://developer.android.com/reference/androidx/camera/view/PreviewView#setImplementationMode(androidx.camera.view.PreviewView.ImplementationMode)) for more information
 * @platform Android
 */
export type PreviewImplementationMode = 'performance' | 'compatible'

/**
 * Represents the resize mode for the {@linkcode PreviewView}.
 * - `'cover'`: Upscales the {@linkcode PreviewView} to cover up the entire view and leave no blank space, possibly performing a center-crop transform
 * to make up for aspect ratio differences.
 * - `'contain'`: Centers the {@linkcode PreviewView} inside the view, possibly leaving blank space around the top/bottom, or left/right edges to
 * make up for aspect ratio differences.
 */
export type PreviewResizeMode = 'cover' | 'contain'

export interface PreviewViewProps extends HybridViewProps {
  /**
   * Sets the {@linkcode CameraPreviewOutput} for the {@linkcode PreviewView}.
   *
   * The {@linkcode CameraPreviewOutput} can be connected to a
   * {@linkcode CameraSession} to start in parallel, possibly
   * even before the {@linkcode PreviewView} is mounted/visible.
   */
  previewOutput?: CameraPreviewOutput

  /**
   * Sets the {@linkcode PreviewResizeMode} for the {@linkcode PreviewView}.
   *
   * @default 'cover'
   */
  resizeMode?: PreviewResizeMode

  /**
   * Sets the {@linkcode PreviewImplementationMode} for the {@linkcode PreviewView}.
   *
   * @platform Android
   * @default 'performance'
   */
  implementationMode?: PreviewImplementationMode

  /**
   * Attaches the given {@linkcode GestureController}s on this {@linkcode PreviewView}.
   *
   * For example, a {@linkcode ZoomGestureController} can be attached to
   * install a native pinch-to-zoom gesture.
   */
  gestureControllers?: GestureController[]

  /**
   * Fires when the {@linkcode PreviewView} started.
   */
  onPreviewStarted?: () => void
  /**
   * Fires when the {@linkcode PreviewView} stopped.
   */
  onPreviewStopped?: () => void
}

export interface PreviewViewMethods extends HybridViewMethods {
  /**
   * Creates a {@linkcode MeteringPoint} that can be used for
   * focusing AE/AF/AWB on the Camera via {@linkcode CameraController.focusTo | focusTo(...)}.
   *
   * The coordinates ({@linkcode viewX}, {@linkcode viewY}) are relative to this
   * {@linkcode PreviewView}, and take orientation, scaling and cropping
   * into account.
   * @param viewX The X coordinate within the View's coordinate system.
   * This can be the `x` value of a tap event on the {@linkcode PreviewView}.
   * @param viewY The Y coordinate within the View's coordinate system.
   * This can be the `y` value of a tap event on the {@linkcode PreviewView}.
   * @param size (Optional) The size of the {@linkcode MeteringPoint} within
   * the View's coordinate system.
   *
   * @throws If the {@linkcode PreviewView} isn't ready yet.
   */
  createMeteringPoint(
    viewX: number,
    viewY: number,
    size?: number,
  ): MeteringPoint

  /**
   * Take a snapshot of the current {@linkcode PreviewView}'s
   * contents, and return it as an {@linkcode Image}.
   *
   * @throws If the {@linkcode PreviewView} isn't ready yet.
   * @throws If the {@linkcode PreviewView} doesn't have snapshottable contents.
   * @throws If the {@linkcode PreviewView} doesn't support snapshots.
   * @platform Android
   */
  takeSnapshot(): Promise<Image>

  /**
   * Converts the given {@linkcode cameraPoint} in
   * camera sensor coordinates into a {@linkcode Point}
   * in view coordinates, relative to this {@linkcode PreviewView}.
   *
   * @note Camera sensor coordinates are not necessarily normalized from `0.0` to `1.0`. Some implementations may have a different opaque coordinate system.
   * @throws If the {@linkcode PreviewView} isn't ready yet.
   * @example
   * ```ts
   * const cameraPoint = { x: 0.5, y: 0.5 }
   * const viewPoint = previewView.convertCameraPointToViewPoint(cameraPoint)
   * console.log(viewPoint) // { x: 196, y: 379.5 }
   * ```
   */
  convertCameraPointToViewPoint(cameraPoint: Point): Point
  /**
   * Converts the given {@linkcode viewPoint} in
   * view coordinates relative to this {@linkcode PreviewView}
   * into a {@linkcode Point} in camera sensor coordinates.
   *
   * @note Camera sensor coordinates are not necessarily normalized from `0.0` to `1.0`. Some implementations may have a different opaque coordinate system.
   * @throws If the {@linkcode PreviewView} isn't ready yet.
   * @example
   * ```ts
   * const viewPoint = { x: 196, y: 379.5 }
   * const cameraPoint = previewView.convertViewPointToCameraPoint(viewPoint)
   * console.log(cameraPoint) // { x: 0.5, y: 0.5 }
   * ```
   */
  convertViewPointToCameraPoint(viewPoint: Point): Point
  /**
   * Returns a new {@linkcode ScannedObject} where all coordinates
   * in the given {@linkcode scannedObject} are converted into
   * view coordinates.
   * @param scannedObject The scanned object in its original coordinates.
   * @platform iOS
   */
  convertScannedObjectCoordinatesToViewCoordinates(
    scannedObject: ScannedObject,
  ): ScannedObject
}

/**
 * The {@linkcode PreviewView} Hybrid View.
 *
 * A {@linkcode PreviewView} can be rendered via the
 * {@linkcode NativePreviewView} component, or by
 * using the higher-level {@linkcode Camera} component.
 *
 * @see {@linkcode PreviewViewProps}
 * @see {@linkcode PreviewViewMethods}
 * @see {@linkcode NativePreviewView}
 */
export type PreviewView = HybridView<PreviewViewProps, PreviewViewMethods>
