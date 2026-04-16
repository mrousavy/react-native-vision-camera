import type { CameraDevice } from '../inputs/CameraDevice.nitro'

/**
 * Specifies the stabilization algorithm/mode to use.
 *
 * Stabilization uses software and/or hardware processing to reduce visible shake.
 * Most software algorithms reduce the visible field of view (FoV) to account for rapid movements.
 * Some modes may introduce additional latency by buffering frames for stronger stabilization.
 * - `'standard'`: Enables general-purpose stabilization, typically best for recorded video.
 * - `'cinematic'`: Uses stronger cinematic-style smoothing.
 * - `'cinematic-extended'`: Uses an even stronger cinematic-style stabilization mode.
 * - `'preview-optimized'`: Prioritizes stabilization for the live preview experience.
 * - `'cinematic-extended-enhanced'`: Uses the strongest cinematic-style stabilization mode.
 * - `'low-latency'`: Prioritizes lower stabilization processing latency.
 */
export type StabilizationMode =
  | 'standard'
  | 'cinematic'
  | 'cinematic-extended'
  | 'preview-optimized'
  | 'cinematic-extended-enhanced'
  | 'low-latency'

/**
 * Specifies a target {@linkcode StabilizationMode}.
 *
 * - {@linkcode StabilizationMode}: A specific {@linkcode StabilizationMode} - this has to be supported by the {@linkcode CameraDevice}.
 * - `'auto'`: Automatically chooses a suitable {@linkcode StabilizationMode}.
 * - `'off'`: Disables stabilization entirely.
 *
 */
export type TargetStabilizationMode = StabilizationMode | 'off' | 'auto'
