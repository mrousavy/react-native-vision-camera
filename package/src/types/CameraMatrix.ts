import type { Orientation } from './Orientation'

export interface CameraMatrix {
  orientation: Orientation
  isMirrored: boolean
  width: number
  height: number
}
