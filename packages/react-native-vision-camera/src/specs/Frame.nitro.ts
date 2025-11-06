import type { HybridObject } from 'react-native-nitro-modules'
import type { PixelFormat } from './common-types/PixelFormat'
import type { Image } from 'react-native-nitro-image'
import type { Orientation } from './common-types/Orientation'

/**
 * Represents a single Plane of a **planar** {@linkcode Frame}.
 */
export interface FramePlane extends HybridObject<{ ios: 'swift' }> {
  /**
   * Returns the width of this Plane.
   *
   * @note If this Plane (or it's parent Frame) is invalid ({@linkcode isValid}),
   * this just returns `0`.
   */
  readonly width: number
  /**
   * Returns the height of this Plane.
   *
   * @note If this Plane (or it's parent Frame) is invalid ({@linkcode isValid}),
   * this just returns `0`.
   */
  readonly height: number
  /**
   * Gets whether this {@linkcode FramePlane} (or it's parent {@linkcode Frame})
   * is still valid, or not.
   *
   * If the Plane is invalid, you cannot access it's data anymore.
   * A Plane is automatically invalidated via {@linkcode HybridObject.dispose | dispose()}.
   */
  readonly isValid: boolean
  /**
   * Gets the {@linkcode FramePlane}'s pixel data as an `ArrayBuffer`.
   *
   * @discussion
   * This does **not** perform a copy, but since the {@linkcode Frame}'s data is stored
   * on the GPU, it might lazily perform a GPU -> CPU download.
   *
   * @discussion
   * Once the {@linkcode FramePlane} gets invalidated ({@linkcode isValid} == false),
   * this ArrayBuffer is no longer safe to access.
   *
   * @note If this Plane (or it's parent Frame) is invalid ({@linkcode isValid}),
   * this method throws.
   */
  getPixelBuffer(): ArrayBuffer
}

/**
 * Represents a single Frame the Camera "sees".
 *
 * @discussion
 * Typically, a `CameraOutput` like `CameraFrameOutput` produces
 * instances of this type.
 *
 * @discussion
 * The Frame's pixel data is generally stored on the GPU, and not copied to the
 * CPU unless you access it via {@linkcode getPixelBuffer | Frame.getPixelBuffer()}
 * or {@linkcode FramePlane.getPixelBuffer | FramePlane.getPixelBuffer()}.
 *
 * @discussion
 * The Frame is either **planar** or **non-planar** ({@linkcode isPlanar}).
 * - A **planar** Frame's (often YUV) pixel data can be accessed on
 * the CPU via {@linkcode getPlanes | Frame.getPlanes()}, where each
 * {@linkcode FramePlane} represents one plane of the pixel data. In YUV,
 * this is often 1 **Y** Plane in full resolution, and 1 **UV** Plane in half
 * resolution. In this case, {@linkcode getPixelBuffer | Frame.getPixelBuffer()}'s
 * behaviour is undefined - sometimes it contains the whole pixel data in a
 * contiguous block of memory, sometimes it just contains the data in the control block.
 * - A **non-planar** Frame's (often RGB) pixel data can be accessed
 * on the CPU via {@linkcode getPixelBuffer | Frame.getPixelBuffer()} as one
 * contiguous block of memory. In this case, {@linkcode getPlanes | Frame.getPlanes()}
 * will return an empty array (`[]`).
 *
 * It is recommended to not rely on {@linkcode getPixelBuffer | Frame.getPixelBuffer()}
 * for **planar** Frames.
 */
export interface Frame extends HybridObject<{ ios: 'swift' }> {
  /**
   * Gets the presentation timestamp this Frame was timed at.
   *
   * @note If this Frame is invalid ({@linkcode isValid}), this just returns `0`.
   */
  readonly timestamp: number
  /**
   * Gets whether this Frame is still valid, or not.
   * If the Frame is invalid, you cannot access it's data anymore.
   * A Frame is automatically invalidated via {@linkcode HybridObject.dispose | dispose()}.
   */
  readonly isValid: boolean
  /**
   * Gets the total width of the Frame.
   *
   * If this is a planar Frame (see {@linkcode isPlanar}),
   * the individual planes (see {@linkcode getPlanes()})
   * will likely have different widths than the total width.
   * For example, a YUV Frame's UV Plane is half the size of it's Y Plane.
   *
   * @note If this Frame is invalid ({@linkcode isValid}), this just returns `0`.
   */
  readonly width: number
  /**
   * Gets the total height of the Frame.
   *
   * If this is a planar Frame (see {@linkcode isPlanar}),
   * the individual planes (see {@linkcode getPlanes()})
   * will likely have different heights than the total height.
   * For example, a YUV Frame's UV Plane is half the size of it's Y Plane.
   *
   * @note If this Frame is invalid ({@linkcode isValid}), this just returns `0`.
   */
  readonly height: number
  /**
   * Gets the {@linkcode PixelFormat} of this Frame's pixel data.
   * Common formats are {@linkcode PixelFormat | 'yuv-420-8-bit-video'}
   * for native YUV Frames, or {@linkcode PixelFormat | 'rgb-bgra-32-bit'}
   * for processed RGB Frames.
   *
   * @note If this Frame is invalid ({@linkcode isValid}), this just returns
   * {@linkcode PixelFormat | 'unknown'}.
   */
  readonly pixelFormat: PixelFormat
  /**
   * Gets the orientation this {@linkcode Frame} is rotated in
   * respective to the Camera's desired orientation.
   *
   * The Camera's desired orientation might be controlled by the
   * Phone's interface orientation, but can also be locked.
   *
   * @discussion
   * - If this is {@linkcode Orientation | 'up'}, the Frame is already
   * in it's correct orientation.
   * - If this is {@linkcode Orientation | 'right'}, the Frame is
   * rotated one time to the right (+90°) relative to the Camera desired
   * orientation.
   * - ...and so on
   *
   * If you intend to perform any processing on the Frame, you must
   * interpret the pixel data counter-rotated to what this value holds.
   *
   * @discussion
   * The reason a {@linkcode Frame}'s pixel data is not just always
   * automatically rotated to {@linkcode Orientation | 'up'} is because
   * it would cause a processing overhead.
   * Instead, the Camera always streams Frames in it's native hardware
   * orientation to avoid any overhead, and control the presentation
   * later via EXIF flags, transforms, or cheaper alternatives to actual
   * buffer rotation.
   */
  readonly orientation: Orientation
  /**
   * Returns whether this {@linkcode Frame} is **planar** or **non-planar**.
   * - If a Frame is **planar** (e.g. YUV), you should only access it's pixel buffer
   * via {@linkcode getPlanes()} instead of {@linkcode getPixelBuffer()}.
   * - If a Frame is **non-planar** (e.g. RGB), you can access it's pixel buffer
   * via {@linkcode getPixelBuffer()} instead of {@linkcode getPlanes()}.
   *
   * @note If this Frame is invalid ({@linkcode isValid}), this just returns `false`.
   */
  readonly isPlanar: boolean

  /**
   * Returns each plane of a **planar** Frame (see {@linkcode isPlanar}).
   * If this Frame is **non-planar**, this method returns an empty array (`[]`).
   *
   * @note If this Frame is invalid ({@linkcode isValid}), this method throws.
   */
  getPlanes(): FramePlane[]

  /**
   * Gets the {@linkcode Frame}'s entire pixel data as a full contiguous `ArrayBuffer`,
   * if it contains one.
   *
   * @discussion
   * - If the frame is planar (see {@linkcode isPlanar | Frame.isPlanar}, e.g. YUV), this
   * might or might not contain valid data.
   * - If the frame is **not** planar (e.g. RGB), this will contain the entire pixel data.
   *
   * @discussion
   * This does **not** perform a copy, but since the {@linkcode Frame}'s data is stored
   * on the GPU, it might lazily perform a GPU -> CPU download.
   *
   * @discussion
   * Once the {@linkcode Frame} gets invalidated ({@linkcode isValid} == false),
   * this ArrayBuffer is no longer safe to access.
   *
   * @note If this Frame is invalid ({@linkcode isValid}), this method throws.
   */
  getPixelBuffer(): ArrayBuffer

  /**
   * Converts this {@linkcode Frame} to an {@linkcode Image}.
   * This performs a CPU copy.
   *
   * @note If this Frame is invalid ({@linkcode isValid}), this method throws.
   */
  toImage(): Image
  /**
   * Converts this {@linkcode Frame} to an {@linkcode Image}.
   * This performs a CPU copy.
   *
   * @note If this Frame is invalid ({@linkcode isValid}), this method throws.
   */
  toImageAsync(): Promise<Image>
}
