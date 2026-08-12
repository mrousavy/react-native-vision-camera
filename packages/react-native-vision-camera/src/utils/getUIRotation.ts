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

/**
 * Gets the signed rotation needed to keep UI elements upright relative to the
 * Camera output orientation.
 *
 * The result is normalized to the shortest cardinal rotation, with opposite
 * orientations represented as `180`.
 */
export function getUIRotation(
  outputOrientation: CameraOrientation,
  interfaceOrientation: CameraOrientation,
): number {
  // Convert to degrees
  const outputOrientationDegrees = cameraOrientationToDegrees(outputOrientation)
  const interfaceOrientationDegrees =
    cameraOrientationToDegrees(interfaceOrientation)
  // Calculate difference, not overshooting 360°
  const rotation =
    (interfaceOrientationDegrees - outputOrientationDegrees + 360) % 360
  const normalizedRotation = rotation % 360
  if (normalizedRotation > 180) {
    // Converts 270° to -90°
    return normalizedRotation - 360
  } else {
    return normalizedRotation
  }
}
