import type { CameraProps } from '../../hooks/useCamera'
import type { CameraFrameOutput } from '../outputs/CameraFrameOutput.nitro'
import type { CameraOutput } from '../outputs/CameraOutput.nitro'
import type { CameraPhotoOutput } from '../outputs/CameraPhotoOutput.nitro'
import type { CameraPreviewOutput } from '../outputs/CameraPreviewOutput.nitro'
import type { CameraVideoOutput } from '../outputs/CameraVideoOutput.nitro'
import type { CameraSession } from '../session/CameraSession.nitro'
import type { CameraSessionConnection } from '../session/CameraSessionConnection'
import type { TargetDynamicRange } from './DynamicRange'
import type { PixelFormat } from './PixelFormat'
import type { TargetStabilizationMode } from './StabilizationMode'

/**
 * A constraint to set a given FPS `number` for any Video,
 * Frame or Preview Streams (e.g. {@linkcode CameraVideoOutput},
 * {@linkcode CameraFrameOutput}, or {@linkcode CameraPreviewOutput})
 *
 * @example
 * ```ts
 * { fps: 60 }
 * ```
 */
export interface FPSConstraint {
  fps: number
}
/**
 * A constraint to set a {@linkcode TargetStabilizationMode} for Video
 * Streams (e.g. {@linkcode CameraVideoOutput}).
 *
 * @example
 * ```ts
 * { videoStabilizationMode: 'cinematic' }
 * ```
 */
export interface VideoStabilizationModeConstraint {
  videoStabilizationMode: TargetStabilizationMode
}
/**
 * A constraint to set a {@linkcode TargetStabilizationMode} for Preview
 * Streams (e.g. {@linkcode CameraPreviewOutput}).
 *
 * @example
 * ```ts
 * { previewStabilizationMode: 'preview-optimized' }
 * ```
 */
export interface PreviewStabilizationModeConstraint {
  previewStabilizationMode: TargetStabilizationMode
}
/**
 * A constraint to bias the resolution of the given {@linkcode CameraOutput}
 * over other constraints.
 *
 * @discussion
 * The resolution bias goes both ways; for example, if the given
 * {@linkcode CameraOutput}'s resolution is very low, a Camera
 * configuration most closely matching that low resolution will
 * be used.
 *
 * If there are two resolution bias constraints, one with a very
 * high, and one with a very low output target resolution, a
 * good "middle-ground" will be chosen.
 *
 * @discussion
 * Resolution negotiation prefers aspect ratio matches
 * over raw pixel count differences first, then uses a
 * logarithmic scale to compare resolution differences.
 *
 * @example
 * If Photo is more important than Video:
 * ```ts
 * [
 *   { resolutionBias: photoOutput },
 *   { resolutionBias: videoOutput }
 * ]
 * ```
 * @example
 * If Video is more important than Photo:
 * ```ts
 * [
 *   { resolutionBias: videoOutput },
 *   { resolutionBias: photoOutput }
 * ]
 * ```
 */
export interface ResolutionBiasConstraint {
  resolutionBias: CameraOutput
}
/**
 * A constraint to set {@linkcode TargetDynamicRange} for Video
 * Streams (e.g. {@linkcode CameraVideoOutput}).
 *
 * @example
 * HDR HLG BT2020
 * ```ts
 * { videoDynamicRange: { bitDepth: 'hdr-10-bit', colorSpace: 'hlg-bt2020', colorRange: 'full' } }
 * ```
 */
export interface VideoDynamicRangeConstraint {
  videoDynamicRange: TargetDynamicRange
}
/**
 * A constraint to set Photo HDR for Photo Outputs (e.g.
 * {@linkcode CameraPhotoOutput})
 *
 * @example
 * ```ts
 * { photoHDR: true }
 * ```
 */
export interface PhotoHDRConstraint {
  photoHDR: boolean
}
/**
 * A constraint to prefer a streaming Format with
 * the given target {@linkcode PixelFormat}.
 *
 * @example
 * ```ts
 * { pixelFormat: 'yuv-420-8-bit-full' }
 * ```
 */
export interface PixelFormatConstraint {
  pixelFormat: PixelFormat
}
/**
 * A constraint to prefer a binned format, or prefer a non-binned format.
 *
 * @discussion
 * Pixel binning combines multiple neighboring sensor pixels into one larger effective pixel.
 * This usually improves low-light sensitivity and reduces noise, but can trade away fine detail
 * compared to a full-resolution non-binned readout.
 * Additionally, binned formats are more performant as they use significantly less bandwidth.
 *
 * @example
 * For higher spatial detail, prefer a non-binned format:
 * ```ts
 * { binned: false }
 * ```
 * @example
 * For better low-light sensitivity and better performance, prefer a binned format:
 * ```ts
 * { binned: true }
 * ```
 */
export interface BinnedConstraint {
  binned: boolean
}

/**
 * Constraints are session configuration options that are negotiated by
 * the {@linkcode CameraSession} to find a closest-matching working
 * Camera configuration.
 *
 * In other words, Constraints describe _intent_.
 *
 * @see {@linkcode CameraSessionConnection.constraints}
 * @see {@linkcode CameraProps.constraints}
 *
 * @example
 * If Photo capture is more important than Video capture, list
 * a `{ resolutionBias: ... }` constraint (and potentially also
 * a `{ photoHDR: ... }` constraint) above your video constraints:
 * ```ts
 * const contraints = [
 *   { resolutionBias: photoOutput },
 *   { photoHDR: true },
 *   { resolutionBias: videoOutput }
 * ] satisfies Constraint[]
 * ```
 *
 * @example
 * To stream at 60 FPS, simply set an `{ fps: ... }`
 * constraint to your target frame rate:
 * ```ts
 * const contraints = [
 *   { fps: 60 },
 * ] satisfies Constraint[]
 * ```
 *
 * @example
 * To prefer a specific `StabilizationMode`, use a
 * `{ videoStabilizationMode: ... }` constraint:
 * ```ts
 * const contraints = [
 *   { videoStabilizationMode: 'cinematic-extended' },
 * ] satisfies Constraint[]
 * ```
 */
export type Constraint =
  | FPSConstraint
  | VideoStabilizationModeConstraint
  | PreviewStabilizationModeConstraint
  | ResolutionBiasConstraint
  | VideoDynamicRangeConstraint
  | PhotoHDRConstraint
  | PixelFormatConstraint
  | BinnedConstraint
