import type { HybridObject } from 'react-native-nitro-modules'
import type { Point } from '../common-types/Point'
import type { Size } from '../common-types/Size'
import type { Depth } from './Depth.nitro'
import type { Photo } from './Photo.nitro'

/**
 * Camera Calibration Data is per-frame data
 * used to counter-apply any transformations applied
 * by the Camera/ISP.
 *
 * It can be useful to undo any distortion correction,
 * or compute scenery in 3D space.
 *
 * @see {@linkcode Depth.cameraCalibrationData}
 * @see {@linkcode Photo.calibrationData}
 * @platform iOS
 */
export interface CameraCalibrationData
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * The size of one pixel at {@linkcode intrinsicMatrixReferenceDimensions} in millimeters.
   */
  readonly pixelSize: number
  /**
   * The reference frame dimensions used in calculating a camera's principal point.
   */
  readonly intrinsicMatrixReferenceDimensions: Size
  /**
   * A {@linkcode Point} describing the offset of the lens' distortion center
   * from the top left in {@linkcode intrinsicMatrixReferenceDimensions}.
   */
  readonly lensDistortionCenter: Point

  /**
   * Gets the Camera intrinsic matrix, which maps 3D Camera coordinates
   * to 2D Pixel coordinates.
   *
   * The returned array is a 3x3 matrix with column-major ordering.
   * Its origin is the top-left of the Frame.
   *
   * ```
   * K = [ fx   0  cx ]
   *     [  0  fy  cy ]
   *     [  0   0   1 ]
   * ```
   * - `fx`, `fy`: focal length in pixels
   * - `cx`, `cy`: principal point in pixels
   *
   * @example
   * ```ts
   * const matrix = calibrationData.cameraIntrinsicMatrix
   * const fx = matrix[0]
   * const fy = matrix[4]
   * ```
   */
  readonly cameraIntrinsicMatrix: number[]
  /**
   * Gets the Camera extrinsic matrix, which maps world space
   * to camera space.
   *
   * The returned array is a 3x4 matrix with column-major ordering.
   *
   * ```
   * K = [ r11 r12 r13 tx ]
   *     [ r21 r22 r23 ty ]
   *     [ r31 r32 r33 tz ]
   * ```
   * - `r`: Rotation/orientation
   * - `t`: Translation/position (in millimeters)
   */
  readonly cameraExtrinsicsMatrix: number[]
}
