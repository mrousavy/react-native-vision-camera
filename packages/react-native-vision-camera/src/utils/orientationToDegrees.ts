import type { CameraOrientation } from '../specs/common-types/CameraOrientation'

export function cameraOrientationToDegrees(
  orientation: CameraOrientation,
): 0 | 90 | 180 | 270 {
  switch (orientation) {
    case 'up':
      return 0
    case 'right':
      return 90
    case 'down':
      return 180
    case 'left':
      return 270
  }
}

export function rotateBy(degrees: number, byDegrees: number): number {
  const rotated = degrees + byDegrees
  return rotated % 360
}
