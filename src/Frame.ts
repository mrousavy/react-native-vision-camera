import type { SkCanvas, SkPaint } from '@shopify/react-native-skia';
import type { Orientation } from './Orientation';

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
   * consideration when running a frame processor. See also: `isMirrored`
   */
  orientation: Orientation;

  /**
   * Get the underlying data of the Frame as a uint8 array buffer.
   *
   * Note that Frames are allocated on the GPU, so calling `toArrayBuffer()` will copy from the GPU to the CPU.
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
  /**
   * Renders the Frame to the screen.
   *
   * By default a Frame has already been rendered to the screen once, so if you call this method again,
   * previously drawn content will be overwritten.
   *
   * @param paint (Optional) A Paint object to use to draw the Frame with. For example, this can contain a Shader (ImageFilter)
   * @example
   * ```ts
   * const INVERTED_COLORS_SHADER = `
   *  uniform shader image;
   *  half4 main(vec2 pos) {
   *    vec4 color = image.eval(pos);
   *    return vec4(1.0 - color.rgb, 1.0);
   * }`
   * const runtimeEffect = Skia.RuntimeEffect.Make(INVERT_COLORS_SHADER)
   * if (runtimeEffect == null) throw new Error('Shader failed to compile!')
   * const shaderBuilder = Skia.RuntimeShaderBuilder(runtimeEffect)
   * const imageFilter = Skia.ImageFilter.MakeRuntimeShader(shaderBuilder, null, null)
   * const paint = Skia.Paint()
   * paint.setImageFilter(imageFilter)
   *
   * const frameProcessor = useFrameProcessor((frame) => {
   *   'worklet'
   *   frame.render(paint) // <-- draws frame with inverted colors now
   * }, [paint])
   * ```
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
