import type { SkCanvas, SkPaint } from '@shopify/react-native-skia';

/**
 * A single frame, as seen by the camera.
 */
export interface Frame extends SkCanvas {
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
   * Renders the Frame to the screen.
   *
   * By default a Frame has already been rendered to the screen once, so if you call this method again,
   * previously drawn content will be overwritten.
   *
   * @param paint (Optional) A Paint object to use to draw the Frame with. For example, this can contain a Shader (ImageFilter)
   */
  render: (paint?: SkPaint) => void;
}

export interface FrameInternal extends Frame {
  /**
   * Increment the Frame Buffer ref-count by one.
   *
   * This is a private API, do not use this.
   */
  incrementRefCount(): void;
  /**
   * Increment the Frame Buffer ref-count by one.
   *
   * This is a private API, do not use this.
   */
  decrementRefCount(): void;
}
