import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraFormat, MediaType } from '../CameraFormat.nitro'
import type { DeviceType } from '../common-types/DeviceType'
import type { FocusMode } from '../common-types/FocusMode'
import type { Point } from '../common-types/Point'
import type { Rect } from '../common-types/Rect'
import type { ExposureMode } from '../common-types/ExposureMode'
import type { Size } from '../common-types/Size'
import type { WhiteBalanceMode } from '../common-types/WhiteBalanceMode'
import type { CameraPosition } from '../common-types/CameraPosition'
import type { TorchMode } from '../common-types/TorchMode'

export interface CameraDevice extends HybridObject<{ ios: 'swift' }> {
  // pragma MARK: Device Metadata
  readonly id: string
  readonly modelID: string
  readonly localizedName: string
  readonly manufacturer: string
  readonly type: DeviceType
  readonly position: CameraPosition
  readonly constituentDevices: CameraDevice[]

  // pragma MARK: Device State
  readonly isConnected: boolean
  readonly isSuspended: boolean
  readonly isUsedByAnotherApp: boolean
  readonly isVirtualDevice: boolean

  // pragma MARK: Focal Length
  /**
   * Returns the Camera Device's nominal focal length in 35mm film format.
   */
  readonly focalLength?: number

  // pragma MARK: Continuity
  readonly isContinuityCamera: boolean
  readonly companionDeskViewCamera?: CameraDevice

  // pragma MARK: Methods
  hasMediaType(mediaType: MediaType): boolean

  // pragma MARK: Formats
  readonly formats: CameraFormat[]

  // pragma MARK: Focus
  supportsFocusMode(mode: FocusMode): boolean
  readonly supportsSmoothAutoFocus: boolean
  readonly supportsFocusingPoint: boolean
  readonly supportsFocusingRect: boolean
  getDefaultRectForFocusPoint(point: Point): Rect
  readonly minFocusRectSize?: Size
  readonly isAdjustingFocus: boolean
  readonly supportsLockingFocusLensPosition: boolean
  readonly lensPosition: number

  // pragma MARK: Exposure
  supportsExposureMode(exposureMode: ExposureMode): boolean
  readonly supportsExposurePoint: boolean
  readonly supportsExposureRect: boolean
  readonly minExposureRectSize?: Size
  getDefaultRectForExposurePoint(point: Point): Rect
  readonly isAdjustingExposure: boolean
  readonly exposureDuration: number
  readonly activeMaxExposureDuration: number
  readonly iso: number
  readonly lensAperture: number

  // pragma MARK: White Balance
  supportsWhiteBalanceMode(whiteBalanceMode: WhiteBalanceMode): boolean
  readonly isAdjustingWhiteBalance: boolean
  readonly supportsLockingWhiteBalanceGains: boolean

  // pragma MARK: Flash
  readonly hasFlash: boolean
  readonly isFlashReady: boolean
  readonly hasTorch: boolean
  readonly isTorchReady: boolean
  readonly torchLevel: number
  readonly torchMode: TorchMode
  supportsTorchMode(torch: TorchMode): boolean

  // pragma MARK: Low Light Boost
  readonly supportsLowLightBoost: boolean
  readonly isLowLightBoostEnabled: boolean

  // pragma MARK: Zoom
  readonly minZoom: number
  readonly maxZoom: number
  readonly zoomLensSwitchFactors: number[]
  readonly displayVideoZoomFactorMultiplier: number
  readonly isZoomingAnimation: boolean
  readonly supportsDistortionCorrection: boolean
  readonly enableDistortionCorrection: boolean
}
