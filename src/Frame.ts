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

  /**
   * Renders the Frame to the screen.
   *
   * @param paint (Optional) A Paint object to use to draw the Frame with. For example, this can contain a Shader (ImageFilter)
   */
  render: (paint?: SkPaint) => void;
}
