export type FrameDroppedReason =
  | 'frame-was-late'
  | 'out-of-buffers'
  | 'discontinuity'
  | 'unknown'
