import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraOrientation } from '../common-types/CameraOrientation'
import type { DepthPixelFormat } from '../common-types/DepthPixelFormat'
import type { NativeBuffer } from '../common-types/NativeBuffer'
import type { Point } from '../common-types/Point'
import type { CameraDepthFrameOutput } from '../outputs/CameraDepthFrameOutput.nitro'
import type { CameraCalibrationData } from './CameraCalibrationData.nitro'
import type { Frame } from './Frame.nitro'

export type AuxilaryDepthType = 'depth' | 'disparity'
export type DepthDataAccuracy = 'relative' | 'absolute' | 'unknown'
export type DepthDataQuality = 'low' | 'high' | 'unknown'

/**
 * A {@linkcode Depth} Frame is a frame
 * captured from a {@linkcode CameraDepthFrameOutput}.
 *
 * It contains depth data which can
 * be accessed via native plugins,
 * or from JS using {@linkcode getDepthData | getDepthData()}.
 *
 * The depth's format ({@linkcode pixelFormat})
 * specifies the returned `ArrayBuffer`'s format.
 *
 * Depth data has to be disposed (see {@linkcode Depth.dispose | dispose()})
 * to free up the memory, otherwise the producing pipeline
 * might stall.
 */
export interface Depth
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * The rotation of this {@linkcode Depth} relative to the
   * associated {@linkcode CameraDepthFrameOutput}'s target output orientation.
   *
   * Depth data is not automatically rotated to `'up'` because physically
   * rotating buffers is expensive. The Camera streams depth frames in the
   * hardware's native orientation and adjusts presentation later using
   * metadata, transforms, or here; a flag.
   *
   * @discussion
   * If you process this {@linkcode Depth}, **you** must interpret
   * its pixel data to be rotated by this `orientation`.
   */
  readonly orientation: CameraOrientation
  /**
   * Gets whether this {@linkcode Depth} frame is mirrored alongside the
   * vertical axis.
   */
  readonly isMirrored: boolean
  /**
   * Gets the presentation timestamp this {@linkcode Depth} was timed at.
   *
   * @note If this {@linkcode Depth} is invalid ({@linkcode isValid}), this may return `0`.
   */
  readonly timestamp: number
  /**
   * Gets the total width of this {@linkcode Depth}.
   *
   * @note If this {@linkcode Depth} is invalid ({@linkcode isValid}), this may return `0`.
   */
  readonly width: number
  /**
   * Gets the total height of this {@linkcode Depth}.
   *
   * @note If this {@linkcode Depth} is invalid ({@linkcode isValid}), this may return `0`.
   */
  readonly height: number
  /**
   * Get the number of bytes per row of the
   * underlying pixel buffer.
   *
   * This may return `0` if the {@linkcode Depth}
   * is planar.
   *
   * @see {@linkcode width}
   * @see {@linkcode getDepthData | getDepthData()}
   */
  readonly bytesPerRow: number
  /**
   * Gets the {@linkcode DepthPixelFormat} of this {@linkcode Depth} Frame's
   * pixel data.
   * Common formats are {@linkcode DepthPixelFormat | 'depth-16-bit'}
   * for depth frames, or {@linkcode DepthPixelFormat | 'disparity-16-bit'}
   * for disparity frames.
   *
   * @note If this {@linkcode Depth} frame is invalid ({@linkcode isValid}),
   * this just returns {@linkcode DepthPixelFormat | 'unknown'}.
   */
  readonly pixelFormat: DepthPixelFormat
  /**
   * Gets whether this {@linkcode Depth} is still valid, or not.
   *
   * If the Depth is invalid, you cannot access its data anymore.
   * A Depth is automatically invalidated via {@linkcode HybridObject.dispose | dispose()}.
   */
  readonly isValid: boolean
  /**
   * Gets whether the depth map has been filtered/smoothed by the platform.
   *
   * Filtering typically reduces noise and smoothens out uneven spots in
   * the depth map at the cost of some fine detail.
   *
   * @note If this metadata is unavailable for this {@linkcode Depth}, this may be `false`.
   */
  readonly isDepthDataFiltered: boolean
  /**
   * Gets the measurement accuracy of this {@linkcode Depth}.
   * - {@linkcode DepthDataAccuracy | 'absolute'}: The depth values represent absolute distances.
   * - {@linkcode DepthDataAccuracy | 'relative'}: The depth values represent relative distances.
   * - {@linkcode DepthDataAccuracy | 'unknown'}: Accuracy is unknown or unavailable.
   *
   * @note If this {@linkcode Depth} is invalid ({@linkcode isValid}), this just returns
   * {@linkcode DepthDataAccuracy | 'unknown'}.
   */
  readonly depthDataAccuracy: DepthDataAccuracy
  /**
   * Gets the quality classification of this {@linkcode Depth}.
   * - {@linkcode DepthDataQuality | 'high'}: High quality depth data.
   * - {@linkcode DepthDataQuality | 'low'}: Lower quality depth data.
   * - {@linkcode DepthDataQuality | 'unknown'}: Quality is unknown or unavailable.
   *
   * @note If this {@linkcode Depth} is invalid ({@linkcode isValid}), this just returns
   * {@linkcode DepthDataQuality | 'unknown'}.
   */
  readonly depthDataQuality: DepthDataQuality
  /**
   * Gets the list of {@linkcode DepthPixelFormat | DepthPixelFormats} this
   * {@linkcode Depth} can be converted to using {@linkcode convert | convert(...)}.
   *
   * @note If this {@linkcode Depth} is invalid ({@linkcode isValid}), this returns an empty array (`[]`).
   * @note Some platforms may return an empty array (`[]`) if conversion is not supported.
   */
  readonly availableDepthPixelFormats: DepthPixelFormat[]
  /**
   * Gets the associated {@linkcode CameraCalibrationData} for this
   * {@linkcode Depth}, if available.
   *
   * Camera calibration data can be used to project depth values into
   * camera/world coordinates with higher accuracy.
   *
   * @platform iOS
   */
  readonly cameraCalibrationData?: CameraCalibrationData

  /**
   * Gets the {@linkcode Depth}'s depth data as a full contiguous `ArrayBuffer`.
   *
   * @discussion
   * This does **not** perform a copy, but since the {@linkcode Depth}'s data is stored
   * on the GPU, it might lazily perform a GPU -> CPU download.
   *
   * @discussion
   * Once the {@linkcode Depth} frame gets invalidated ({@linkcode isValid} == false),
   * this ArrayBuffer is no longer safe to access.
   *
   * @throws If this Depth is invalid ({@linkcode isValid}).
   */
  getDepthData(): ArrayBuffer

  /**
   * Get a {@linkcode NativeBuffer} that points to
   * this {@linkcode Depth} frame.
   *
   * This is a shared contract between libraries to pass
   * native buffers around without natively typed bindings.
   *
   * The {@linkcode NativeBuffer} must be released
   * again by its consumer via {@linkcode NativeBuffer.release | release()},
   * otherwise the Camera pipeline might stall.
   */
  getNativeBuffer(): NativeBuffer

  /**
   * Returns a derivative {@linkcode Depth} frame by rotating
   * it to the specified {@linkcode orientation}, and potentially
   * mirroring it.
   */
  rotate(orientation: CameraOrientation, isMirrored: boolean): Depth
  /**
   * Asynchronously returns a derivative {@linkcode Depth} frame by rotating
   * it to the specified {@linkcode orientation}, and potentially
   * mirroring it.
   */
  rotateAsync(
    orientation: CameraOrientation,
    isMirrored: boolean,
  ): Promise<Depth>
  /**
   * Converts this {@linkcode Depth} frame to the target {@linkcode pixelFormat}.
   *
   * The {@linkcode pixelFormat} must be one of the {@linkcode DepthPixelFormat}s
   * returned from {@linkcode availableDepthPixelFormats}.
   */
  convert(pixelFormat: DepthPixelFormat): Depth
  /**
   * Asynchronously converts this {@linkcode Depth} frame to the target {@linkcode pixelFormat}.
   *
   * The {@linkcode pixelFormat} must be one of the {@linkcode DepthPixelFormat}s
   * returned from {@linkcode availableDepthPixelFormats}.
   */
  convertAsync(pixelFormat: DepthPixelFormat): Promise<Depth>

  /**
   * Converts the given {@linkcode cameraPoint} in
   * camera sensor coordinates into a {@linkcode Point}
   * in Depth coordinates, relative to this {@linkcode Depth}.
   *
   * @note Camera sensor coordinates are not necessarily normalized from `0.0` to `1.0`. Some implementations may have a different opaque coordinate system.
   * @example
   * ```ts
   * const cameraPoint = { x: 0.5, y: 0.5 }
   * const depthPoint = depth.convertCameraPointToDepthPoint(cameraPoint)
   * console.log(depthPoint) // { x: 960, y: 360 }
   * ```
   */
  convertCameraPointToDepthPoint(cameraPoint: Point): Point
  /**
   * Converts the given {@linkcode depthPoint} in
   * Depth coordinates relative to this {@linkcode Depth}
   * into a {@linkcode Point} in camera sensor coordinates.
   *
   * @note Camera sensor coordinates are not necessarily normalized from `0.0` to `1.0`. Some implementations may have a different opaque coordinate system.
   * @example
   * ```ts
   * const depthPoint = { x: depth.width / 2, y: depth.height / 2 }
   * const cameraPoint = depth.convertDepthPointToCameraPoint(depthPoint)
   * console.log(cameraPoint) // { x: 0.5, y: 0.5 }
   * ```
   */
  convertDepthPointToCameraPoint(depthPoint: Point): Point

  /**
   * Converts this {@linkcode Depth} frame to a {@linkcode Frame}.
   *
   * The resulting {@linkcode Frame} will contain the depth/disparity
   * data in the current depth/disparity Format.
   *
   * You must release the resulting {@linkcode Frame} again manually
   * using {@linkcode Frame.dispose | Frame.dispose()}.
   */
  toFrame(): Frame
  /**
   * Asynchronously converts this {@linkcode Depth} frame to a {@linkcode Frame}.
   *
   * The resulting {@linkcode Frame} will contain the depth/disparity
   * data in the current depth/disparity Format.
   *
   * You must release the resulting {@linkcode Frame} again manually
   * using {@linkcode Frame.dispose | Frame.dispose()}.
   */
  toFrameAsync(): Promise<Frame>
}
