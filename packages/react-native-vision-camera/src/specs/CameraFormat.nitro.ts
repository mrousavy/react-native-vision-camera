import type { HybridObject } from 'react-native-nitro-modules'
import type { Resolution } from './common-types/Resolution'
import type { VideoStabilizationMode } from './common-types/VideoStabilizationMode'
import type { Range } from './common-types/Range'
import type { ColorSpace } from './common-types/ColorSpace'
import type { AutoFocusSystem } from './common-types/AutoFocusSystem'

export type MediaType = 'video' | 'depth' | 'other'

export interface CameraFormat extends HybridObject<{ ios: 'swift' }> {
  // pragma MARK: Resolutions
  readonly photoResolution: Resolution
  readonly videoResolution: Resolution
  readonly supportedPhotoResolutions: Resolution[]
  readonly supportsHighQualityPhoto: boolean
  readonly isHighestPhotoFormat: boolean

  // pragma MARK: FPS
  readonly supportsAutoFps: boolean
  readonly supportedFpsRanges: Range[]
  readonly maxFps: number
  readonly isVideoBinned: boolean
  readonly supportsVideoHDR: boolean
  readonly supportsMultiCam: boolean

  // pragma MARK: Field of View
  readonly fieldOfView: number
  readonly fieldOfViewDistortionCorrected: number

  // pragma MARK: Background Replacement
  readonly supportsBackgroundReplacement: boolean
  readonly fpsRangeForBackgroundReplacement?: Range

  // pragma MARK: Reaction Effects
  readonly supportsReactionEffects: boolean
  readonly fpsRangeForReactionEffects?: Range

  // pragma MARK: Media Type
  readonly mediaType: MediaType

  // pragma MARK: Auto Focus
  readonly autoFocusSystem: AutoFocusSystem

  // pragma MARK: Video Stabilization
  supportsVideoStabilizationMode(mode: VideoStabilizationMode): boolean

  // pragma MARK: Color Spaces
  readonly supportsGlobalToneMapping: boolean
  readonly supportedColorSpaces: ColorSpace[]

  // pragma MARK: Zoom
  readonly maxZoomFactor: number
  readonly zoomFactorUpscaleThreshold: number
  readonly secondaryNativeResolutionZoomFactory: number[]
  readonly recommendedZoomRange?: Range

  // pragma MARK: Exposure / ISO
  readonly minISO: number
  readonly maxISO: number
  readonly minExposureDuration: number
  readonly maxExposureDuration: number
  readonly recommendedExposureRange?: Range

  // pragma MARK: Depth
  readonly depthDataFormats: CameraFormat[]
  readonly supportedZoomRangesForDepthDataDelivery: Range[]

  // pragma MARK: Smart Framing
  readonly supportsSmartFraming: boolean
  readonly supportsCenterStage: boolean
  readonly fpsRangeForCenterStage?: Range
  readonly zoomRangeForCenterStage?: Range

  // pragma MARK: Portrait Effect
  readonly supportsPortraitEffect: boolean
  readonly supportsPortraitEffectMatteStillImageDelivery: boolean
  readonly fpsRangeForPortraitEffect?: Range

  // pragma MARK: Studio Light
  readonly supportsStudioLight: boolean
  readonly fpsRangeForStudioLight?: Range

  // pragma MARK: Cinematic Video
  readonly supportsCinematicVideo: boolean
  readonly defaultSimulatedAperture?: number
  readonly simulatedApertureRange?: Range
  readonly zoomFactorForCinematicVideo?: Range
  readonly fpsRangeForCinematicVideo?: Range
}
