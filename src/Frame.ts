/**
 * A single frame, as seen by the camera.
 */
export interface Frame {
  /**
   * The raw pixel buffer.
   */
  buffer: unknown[];
  /**
   * Whether the underlying buffer is still valid or not. The buffer will be released after the frame processor returns.
   */
  isValid: boolean;
  /**
   * Whether the underlying buffer is marked as "ready" or not.
   */
  isReady: boolean;
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
   * Returns a string representation of the frame.
   * @example
   * ```ts
   * console.log(frame.toString()) // -> "3840 x 2160 Frame"
   * ```
   */
  toString(): string;
}
