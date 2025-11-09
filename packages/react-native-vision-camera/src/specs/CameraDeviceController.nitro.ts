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
  readonly activeFormat: CameraFormat
  readonly activeDepthFormat?: CameraFormat

  // pragma MARK: FPS
  readonly enableAutoFrameRate: boolean
  readonly fps: Range

  // pragma MARK: Focus
  readonly focusMode: FocusMode
  readonly enableSmoothAutoFocus: boolean
  readonly enableFaceDrivenAutoFocus: boolean

  // pragma MARK: Exposure
  readonly exposureMode: ExposureMode
  readonly enableFaceDrivenAutoExposure: boolean

  // pragma MARK: White Balance
  readonly whiteBalanceMode: WhiteBalanceMode

  // pragma MARK: Low Light Boost
  readonly automaticallyEnableLowLightBoost: boolean

  // pragma MARK: Colors
  readonly enableVideoHDR: boolean
  readonly automaticallyEnableVideoHDR: boolean
  readonly enableGlobalToneMapping: boolean
  readonly colorSpace: ColorSpace

  // pragma MARK: Zoom
  readonly zoom: number
}

// set only
interface SetCameraDeviceConfiguration
  extends Partial<CameraDeviceConfiguration> {}

export interface CameraDeviceController
  extends HybridObject<{ ios: 'swift' }>,
    CameraDeviceConfiguration {
  readonly device: CameraDevice

  configure(config: SetCameraDeviceConfiguration): Promise<void>

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
