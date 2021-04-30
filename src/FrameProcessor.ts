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
}
