import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraDevice } from './inputs/CameraDevice.nitro'
import type { CameraFormat } from './CameraFormat.nitro'
import type { Range } from './common-types/Range'
import type { FocusMode } from './common-types/FocusMode'
import type { Point } from './common-types/Point'
import type { Rect } from './common-types/Rect'
import type { ExposureMode } from './common-types/ExposureMode'
import type { WhiteBalanceMode } from './common-types/WhiteBalanceMode'
import type { WhiteBalanceGains } from './common-types/WhiteBalanceGains'
import type { ColorSpace } from './common-types/ColorSpace'

interface CameraDeviceConfiguration {
  // pragma MARK: Formats
  activeFormat?: CameraFormat
  activeDepthFormat?: CameraFormat

  // pragma MARK: FPS
  enableAutoFrameRate?: boolean
  fps?: Range

  // pragma MARK: Focus
  focusMode?: FocusMode
  enableSmoothAutoFocus?: boolean
  enableFaceDrivenAutoFocus?: boolean

  // pragma MARK: Exposure
  exposureMode?: ExposureMode
  enableFaceDrivenAutoExposure?: boolean

  // pragma MARK: White Balance
  whiteBalanceMode?: WhiteBalanceMode

  // pragma MARK: Low Light Boost
  automaticallyEnableLowLightBoost?: boolean

  // pragma MARK: Colors
  enableVideoHDR?: boolean
  automaticallyEnableVideoHDR?: boolean
  enableGlobalToneMapping?: boolean
  colorSpace?: ColorSpace

  // pragma MARK: Zoom
  zoom?: number
}

export interface CameraDeviceController extends HybridObject<{ ios: 'swift' }> {
  readonly device: CameraDevice

  configure(config: CameraDeviceConfiguration): Promise<void>

  // pragma MARK: Focus
  setFocusPoint(point: Point): Promise<void>
  setFocusRect(rect: Rect): Promise<void>
  setFocusLensPosition(lensPosition: number): Promise<void>

  // pragma MARK: Exposure
  setExposurePoint(point: Point): Promise<void>
  setExposureBias(exposure: number): Promise<void>
  setExposureRect(rect: Rect): Promise<void>
  setExposureLocked(duration: number, iso: number): Promise<void>

  // pragma MARK: White Balance
  setWhiteBalanceLocked(whiteBalanceGains: WhiteBalanceGains): Promise<void>

  // pragma MARK: Flash
  enableTorch(level: number): Promise<void>

  // pragma MARK: Zoom
  startZoomAnimation(zoom: number, rate: number): Promise<void>
  cancelZoomAnimation(): Promise<void>
}
