import type { HybridObject } from 'react-native-nitro-modules'
import type { Constraint } from '../common-types/Constraint'
import type { TargetDynamicRange } from '../common-types/DynamicRange'
import type { PhotoContainerFormat } from '../common-types/PhotoContainerFormat'
import type { CameraFrameOutput } from '../outputs/CameraFrameOutput.nitro'
import type { CameraOutput } from '../outputs/CameraOutput.nitro'
import type { CameraPhotoOutput } from '../outputs/CameraPhotoOutput.nitro'

// TODO: Camera Extensions currently cannot be used in VisionCamera since I refactored to the Constraints API.
//       Since Camera Extensions also affect available features, maybe we can also add it to the Constraints API.
//       Either as { vendorExtension: ... }, or simply hiding it as an implementation detail - e.g. for 'hdr'
//       extension we hide it under `photoHDR: 'native' | 'extension' | 'none'`. That would also allow us to expose
//       more stuff from AVFoundation like portrait effects matte, where the Android counterpart would be the extension.

/**
 * Represents the type of the {@linkcode CameraExtension}.
 *
 * - `'bokeh'`: Bokeh mode blurs the background of a photo. It is generally intended for taking portrait photos of people like what would be produced by a camera with a large lens.
 * - `'hdr'`: HDR mode takes photos that keep a larger range of scene illumination levels visible in the final image. For example, when taking a picture of an object in front of a bright window, both the object and the scene through the window may be visible when using HDR mode, while in normal mode, one or the other may be poorly exposed. As a tradeoff, HDR mode generally takes much longer to capture a single image, has no user control, and may have other artifacts depending on the HDR method used.
 * - `'night'`: Gets the best still images under low-light situations, typically at night time.
 * - `'face-retouch'`: Retouches face skin tone, geometry and so on when taking still images.
 * - `'auto'`: Automatically adjusts the final image with the surrounding scenery. For example, the vendor library implementation might do the low light detection and can switch to low light mode or HDR to take the picture. Or the face retouch mode can be automatically applied when taking a portrait image. This delegates modes to the vendor library implementation to decide.
 */
export type CameraExtensionType =
  | 'bokeh'
  | 'hdr'
  | 'night'
  | 'face-retouch'
  | 'auto'

/**
 * A Camera Extension is a vendor-specific implementation of
 * a private reprocessing pipeline, at ISP level.
 *
 * For example, a vendor like Google Pixel might implement
 * a {@linkcode CameraExtensionType | 'hdr'} extension to make
 * use of the device's private native HDR implementation for
 * photo capture.
 *
 * @see [CameraX Extensions](https://developer.android.com/media/camera/camerax/extensions-api)
 * @note Camera Extensions are only supported on Android
 * @note Camera Extensions only work on SDR video streams - so make sure you don't have a {@linkcode TargetDynamicRange} {@linkcode Constraint}.
 * @note Camera Extensions don't work with RAW capture - make sure you don't have a {@linkcode CameraPhotoOutput} configured for {@linkcode PhotoContainerFormat | 'dng'} attached.
 * @note If {@linkcode CameraExtension.supportsFrameStreaming} is `false`, you cannot use a {@linkcode CameraOutput} that streams frames.
 * @platform Android
 */
export interface CameraExtension
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Represents the type of this {@linkcode CameraExtension}.
   * @see {@linkcode CameraExtensionType}
   */
  readonly type: CameraExtensionType
  /**
   * Whether a Camera Device with this {@linkcode CameraExtension}
   * supports Frame Streaming outputs, or not.
   *
   * If this is `false`, enabling this {@linkcode CameraExtension}
   * and attaching an output that streams Frames (such as
   * {@linkcode CameraFrameOutput}) will throw.
   *
   * @see {@linkcode CameraFrameOutput}
   */
  readonly supportsFrameStreaming: boolean
}
