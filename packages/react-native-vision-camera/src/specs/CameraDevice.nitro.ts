import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraFormat, MediaType } from './CameraFormat.nitro'
import type { DeviceType } from './common-types/DeviceType'
import type { Range } from './common-types/Range'
import type { FocusMode } from './common-types/FocusMode'
import type { Point } from './common-types/Point'
import type { Rect } from './common-types/Rect'
import type { ExposureMode } from './common-types/ExposureMode'
import type { Size } from './common-types/Size'
import type { WhiteBalanceMode } from './common-types/WhiteBalanceMode'
import type { WhiteBalanceGains } from './common-types/WhiteBalanceGains'
import type { CameraPosition } from './common-types/CameraPosition'
import type { TorchMode } from './common-types/TorchMode'
import type { ColorSpace } from './common-types/ColorSpace'

export interface CameraDevice
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
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
  activeFormat: CameraFormat
  activeDepthFormat?: CameraFormat

  // pragma MARK: FPS
  enableAutoFrameRate: boolean
  fps: Range

  // pragma MARK: Focus
  supportsFocusMode(mode: FocusMode): boolean
  focusMode: FocusMode
  readonly supportsSmoothAutoFocus: boolean
  enableSmoothAutoFocus: boolean
  enableFaceDrivenAutoFocus: boolean
  readonly supportsFocusingPoint: boolean
  setFocusPoint(point: Point): Promise<void>
  readonly supportsFocusingRect: boolean
  setFocusRect(rect: Rect): Promise<void>
  getDefaultRectForFocusPoint(point: Point): Rect
  readonly minFocusRectSize?: Size
  readonly isAdjustingFocus: boolean
  readonly supportsLockingFocusLensPosition: boolean
  setFocusLensPosition(lensPosition: number): Promise<void>
  readonly lensPosition: number

  // pragma MARK: Exposure
  supportsExposureMode(exposureMode: ExposureMode): boolean
  exposureMode: ExposureMode
  readonly supportsExposurePoint: boolean
  setExposurePoint(point: Point): Promise<void>
  readonly supportsExposureRect: boolean
  setExposureRect(rect: Rect): Promise<void>
  readonly minExposureRectSize?: Size
  getDefaultRectForExposurePoint(point: Point): Rect
  enableFaceDrivenAutoExposure: boolean
  readonly isAdjustingExposure: boolean
  setExposureBias(exposure: number): Promise<void>
  setExposureLocked(duration: number, iso: number): Promise<void>
  readonly exposureDuration: number
  readonly activeMaxExposureDuration: number
  readonly iso: number
  readonly lensAperture: number

  // pragma MARK: White Balance
  supportsWhiteBalanceMode(whiteBalanceMode: WhiteBalanceMode): boolean
  whiteBalanceMode: WhiteBalanceMode
  readonly isAdjustingWhiteBalance: boolean
  readonly supportsLockingWhiteBalanceGains: boolean
  setWhiteBalanceLocked(whiteBalanceGains: WhiteBalanceGains): Promise<void>

  // pragma MARK: Flash
  readonly hasFlash: boolean
  readonly isFlashReady: boolean
  readonly hasTorch: boolean
  readonly isTorchReady: boolean
  readonly torchLevel: number
  readonly torchMode: TorchMode
  supportsTorchMode(torch: TorchMode): boolean
  enableTorch(level: number): Promise<void>

  // pragma MARK: Low Light Boost
  readonly supportsLowLightBoost: boolean
  readonly isLowLightBoostEnabled: boolean
  automaticallyEnableLowLightBoost: boolean

  // pragma MARK: Colors
  enableVideoHDR: boolean
  automaticallyEnableVideoHDR: boolean
  enableGlobalToneMapping: boolean
  colorSpace: ColorSpace

  // pragma MARK: Zoom
  readonly minZoom: number
  readonly maxZoom: number
  readonly zoomLensSwitchFactors: number[]
  readonly displayVideoZoomFactorMultiplier: number
  zoom: number
  startZoomAnimation(zoom: number, rate: number): Promise<void>
  cancelZoomAnimation(): Promise<void>
  readonly isZoomingAnimation: boolean
  readonly supportsDistortionCorrection: boolean
  readonly enableDistortionCorrection: boolean
}
