import type { Orientation } from './Orientation';
import { PixelFormat } from './PixelFormat';

/**
 * A single frame, as seen by the camera. This is backed by a C++ HostObject wrapping the native GPU buffer.
 * At a 4k resolution, a Frame can be 1.5MB in size.
 *
 * @example
 * ```ts
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet'
 *   console.log(`Frame: ${frame.width}x${frame.height} (${frame.pixelFormat})`)
 * }, [])
 * ```
 */
export interface Frame {
  /**
   * Whether the underlying buffer is still valid or not.
   * A Frame is valid as long as your Frame Processor (or a `runAsync(..)` operation) is still running
   */
  isValid: boolean;
  /**
   * Returns the width of the frame, in pixels.
   */
  width: number;
  /**
   * Returns the height of the frame, in pixels.
   */
  height: number;
  /**
   * Returns the amount of bytes per row.
   */
  bytesPerRow: number;
  /**
   * Returns the number of planes this frame contains.
   */
  planesCount: number;
  /**
   * Returns whether the Frame is mirrored (selfie camera) or not.
   */
  isMirrored: boolean;
  /**
   * Returns the timestamp of the Frame relative to the host sytem's clock.
   */
  timestamp: number;
  /**
   * Represents the orientation of the Frame.
   *
   * Some ML Models are trained for specific orientations, so they need to be taken into
   * consideration when running a frame processor. See also: {@linkcode isMirrored}
   */
  orientation: Orientation;
  /**
   * Represents the pixel-format of the Frame.
   */
  pixelFormat: PixelFormat;

  /**
   * Get the underlying data of the Frame as a uint8 array buffer.
   * The format of the buffer depends on the Frame's {@linkcode pixelFormat}.
   *
   * Note that Frames are allocated on the GPU, so calling `toArrayBuffer()` will copy from the GPU to the CPU.
   *
   * @example
   * ```ts
   * const frameProcessor = useFrameProcessor((frame) => {
   *   'worklet'
   *
   *   if (frame.pixelFormat === 'rgb') {
   *     const data = frame.toArrayBuffer()
   *     console.log(`Pixel at 0,0: RGB(${data[0]}, ${data[1]}, ${data[2]})`)
   *   }
   * }, [])
   * ```
   */
  toArrayBuffer(): Uint8Array;
  /**
   * Returns a string representation of the frame.
   * @example
   * ```ts
   * console.log(frame.toString()) // -> "3840 x 2160 Frame"
   * ```
   */
  toString(): string;
}

/** @internal */
export interface FrameInternal extends Frame {
  /**
   * Increment the Frame Buffer ref-count by one.
   *
   * This is a private API, do not use this.
   * @internal
   */
  incrementRefCount(): void;
  /**
   * Increment the Frame Buffer ref-count by one.
   *
   * This is a private API, do not use this.
   * @internal
   */
  decrementRefCount(): void;
}
