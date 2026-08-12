import type { CameraOrientation } from '../specs/common-types/CameraOrientation'

function cameraOrientationToDegrees(
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

export function getUIRotation(
  outputOrientation: CameraOrientation,
  interfaceOrientation: CameraOrientation,
): number {
  const outputOrientationDegrees = cameraOrientationToDegrees(outputOrientation)
  const interfaceOrientationDegrees =
    cameraOrientationToDegrees(interfaceOrientation)
  // TODO: Calculate UI Rotation here
  return 0
}
