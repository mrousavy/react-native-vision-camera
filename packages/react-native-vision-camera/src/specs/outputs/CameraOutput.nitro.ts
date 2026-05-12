import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraOrientation } from '../common-types/CameraOrientation'
import type { MediaType } from '../common-types/MediaType'
import type { Size } from '../common-types/Size'
import type { CameraSession } from '../session/CameraSession.nitro'

/**
 * A {@linkcode CameraOutput} is the base-class of all
 * outputs that can be connected to the {@linkcode CameraSession}.
 *
 * @discussion
 * You can extend the {@linkcode CameraOutput} Nitro spec
 * in native and conform to the `NativeCameraOutput`
 * interface/protocol to create custom outputs which can
 * be connected to the {@linkcode CameraSession}.
 * This is useful for building custom capture pipelines,
 * such as private HDR implementations, or fully custom
 * video pipelines (e.g. for batching/segmenting video).
 */
export interface CameraOutput
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * The media type of the content being streamed
   * by this {@linkcode CameraOutput}.
   */
  readonly mediaType: MediaType
  /**
   * Gets or sets the output orientation of this {@linkcode CameraOutput}.
   *
   * Individual implementations of {@linkcode CameraOutput}
   * may choose different strategies for implementing
   * output orientation, for example:
   * - A Photo output might apply orientation via EXIF flags.
   * - A Video output might apply orientation via track transform metadata.
   * - A Preview output might apply orientation via view transforms.
   * - A Frame output might not apply orientation and only pass it as a
   * property via the `Frame` object, unless explicitly configured to
   * physically rotate buffers.
   */
  outputOrientation: CameraOrientation
  /**
   * The resolution that the underlying capture pipeline has resolved
   * this {@linkcode CameraOutput} to, in sensor-native (un-rotated) pixels.
   *
   * Returns `undefined` until the output has been attached to a
   * configured {@linkcode CameraSession}. Once bound, the value reflects
   * what the platform actually selected — which may differ from the
   * requested {@linkcode Size} when no exact match exists.
   *
   * @discussion
   * Width/height are pre-rotation sensor dimensions. The final
   * user-visible orientation is applied separately via {@linkcode outputOrientation}.
   *
   * For outputs that are not pixel-based (e.g. metadata-only outputs),
   * this reports the resolution of the upstream video stream feeding
   * the output, or `undefined` if no video input is attached.
   */
  readonly currentResolution?: Size
}
