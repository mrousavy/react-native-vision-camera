import type { HybridObject } from 'react-native-nitro-modules'
import type { Size } from '../common-types/Size'
import type { Point } from '../common-types/Point'

export interface CameraCalibrationData extends HybridObject<{ ios: 'swift' }> {
  /**
   * The size, in millimeters, of one image pixel.
   */
  readonly pixelSize: number
  /**
   * The image dimensions to which the camera’s intrinsic matrix values are relative.
   */
  readonly intrinsicMatrixReferenceDimensions: Size
  /**
   * The offset of the distortion center of the camera lens from the top-left corner of the image.
   */
  readonly lensDistortionCenter: Point

  // TODO: Add extrinsicMatrix: matrix_float4x3
  // TODO: Add intrinsicMatrix: matrix_float3x3
}
