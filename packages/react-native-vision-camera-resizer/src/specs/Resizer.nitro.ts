import type { HybridObject } from 'react-native-nitro-modules'
import type {
  CameraFrameOutput,
  CameraSessionConfig,
  Frame,
  FrameOutputOptions,
  PixelFormat,
  PixelFormatConstraint,
  TargetVideoPixelFormat,
  VideoPixelFormat,
} from 'react-native-vision-camera'
import type { GPUFrame } from './GPUFrame.nitro'
import type { ResizerFactory } from './ResizerFactory.nitro'

/**
 * Represents a GPU-accelerated {@linkcode Frame} resizer and converter.
 *
 * You can create instances of the {@linkcode Resizer} via
 * {@linkcode ResizerFactory.createResizer | ResizerFactory.createResizer(...)}.
 *
 * @discussion
 * The {@linkcode Resizer} internally allocates a memory pool, which can
 * grow quite large, depending on texture size.
 * When you are done with the {@linkcode Resizer}, it is recommended to
 * {@linkcode dispose | dispose()} it to free up resources.
 */
export interface Resizer
  extends HybridObject<{ ios: 'swift'; android: 'c++' }> {
  /**
   * Resize the given {@linkcode frame} using the options
   * this {@linkcode Resizer} was configured with.
   *
   * @discussion
   * - On iOS, the input {@linkcode Frame}'s {@linkcode Frame.pixelFormat | pixelFormat}
   *   has to be {@linkcode VideoPixelFormat | 'yuv-420-8-bit-full'}, which
   *   is configured on the {@linkcode CameraFrameOutput} by setting
   *   {@linkcode FrameOutputOptions.pixelFormat} to
   *   {@linkcode TargetVideoPixelFormat | 'yuv'}.
   * - On Android, the input {@linkcode Frame}'s {@linkcode Frame.pixelFormat | pixelFormat}
   *   can be any pixel format - even {@linkcode PixelFormat | 'private'}.
   *
   * For maximum performance, the resolved {@linkcode CameraSessionConfig}'s
   * {@linkcode CameraSessionConfig.nativePixelFormat | nativePixelFormat}
   * should be {@linkcode VideoPixelFormat | 'yuv-420-8-bit-full'} on iOS,
   * and {@linkcode PixelFormat | 'private'} on Android.
   * Then, set {@linkcode FrameOutputOptions.pixelFormat} to
   * {@linkcode TargetVideoPixelFormat | 'native'} on Android,
   * and {@linkcode TargetVideoPixelFormat | 'native'} if the config's
   * {@linkcode CameraSessionConfig.nativePixelFormat | nativePixelFormat}
   * really is {@linkcode VideoPixelFormat | 'yuv-420-8-bit-full'} (or
   * {@linkcode TargetVideoPixelFormat | 'yuv'} otherwise) for iOS.
   *
   * To configure your session with the target Pixel Format,
   * use a {@linkcode PixelFormatConstraint}.
   *
   * For ML models that expect CHW / NCHW tensors, configure the
   * {@linkcode Resizer} with `pixelLayout: 'planar'`.
   *
   * @returns A {@linkcode GPUFrame} of the converted and resized
   * pixel data.
   * The returned {@linkcode GPUFrame} must be disposed (via
   * {@linkcode GPUFrame.dispose | dispose()}) to ensure the pipeline
   * can run continuously.
   *
   * @example
   * Simple resize
   * ```ts
   * const resizer = ...
   * const frameOutput = useFrameOutput({
   *   pixelFormat: 'yuv',
   *   onFrame(frame) {
   *     'worklet'
   *     if (resizer != null) {
   *       const resized = resizer.resize(frame)
   *       const buffer = resized.getPixelBuffer()
   *       resized.dispose()
   *     }
   *     frame.dispose()
   *   }
   * })
   * ```
   * @example
   * Maximum performance resize
   * ```ts
   * const targetPixelFormat = Platform.select<PixelFormat>({
   *   ios: 'yuv-420-8-bit-full',
   *   android: 'private'
   * })
   * const resizer = ...
   * const frameOutput = useFrameOutput({
   *   pixelFormat: 'native',
   *   onFrame(frame) {
   *     'worklet'
   *     if (resizer != null) {
   *       const resized = resizer.resize(frame)
   *       const buffer = resized.getPixelBuffer()
   *       resized.dispose()
   *     }
   *     frame.dispose()
   *   }
   * })
   * const constraints: Constraint[] = [
   *   { pixelFormat: targetPixelFormat }
   * ]
   * ```
   */
  resize(frame: Frame): GPUFrame
}
