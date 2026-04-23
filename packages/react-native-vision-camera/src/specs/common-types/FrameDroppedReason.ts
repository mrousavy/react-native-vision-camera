import type { Frame } from '../instances/Frame.nitro'

/**
 * Represents the reason why a {@linkcode Frame} was dropped by the Camera pipeline.
 * - `'frame-was-late'`: The Frame took too long to process and could not be delivered in time.
 * - `'out-of-buffers'`: The Camera pipeline ran out of available buffers, most likely because previous
 *   Frames were not disposed ({@linkcode Frame.dispose | Frame.dispose()}) fast enough.
 * - `'discontinuity'`: A discontinuity in the Frame stream occured, typically when the Camera session
 *   was interrupted or reconfigured.
 * - `'unknown'`: The Frame was dropped for an unknown reason.
 */
export type FrameDroppedReason =
  | 'frame-was-late'
  | 'out-of-buffers'
  | 'discontinuity'
  | 'unknown'
