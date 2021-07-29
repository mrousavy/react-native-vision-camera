export interface Plane {
  /**
   * An array of all pixels in this plane.
   */
  pixels: Uint8Array;
}

/**
 * A single frame, as seen by the camera.
 */
export interface Frame {
  /**
   * Get an array of all planes in this current Frame.
   *
   * For YUV images this is an array of 3 elements, one for **Y**, one for **U** and one for **V** pixels.
   */
  getPlanes(): Plane[];
  /**
   * Whether the underlying buffer is still valid or not. The buffer will be released after the frame processor returns, or `close()` is called.
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
   * Returns a string representation of the frame.
   * @example
   * ```ts
   * console.log(frame.toString()) // -> "3840 x 2160 Frame"
   * ```
   */
  toString(): string;
  /**
   * Closes and disposes the Frame.
   * Only close frames that you have created yourself, e.g. by copying the frame you receive in a frame processor.
   *
   * @example
   * ```ts
   * const frameProcessor = useFrameProcessor((frame) => {
   *   const smallerCopy = resize(frame, 480, 270)
   *   // run AI ...
   *   smallerCopy.close()
   *   // don't close `frame`!
   * })
   * ```
   */
  close(): void;
}
