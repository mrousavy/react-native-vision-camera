import type { CameraOrientation } from '../specs/common-types/CameraOrientation'

function orientationToDegrees(orientation: CameraOrientation): number {
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
 * Gets the short rotation that UI controls need to apply to match the target
 * output orientation while remaining relative to the interface orientation.
 *
 * @param targetOrientation The orientation that Camera outputs target.
 * @param interfaceOrientation The current app interface orientation.
 * @returns The shortest signed rotation in degrees.
 */
export function getUIRotation(
  targetOrientation: CameraOrientation,
  interfaceOrientation: CameraOrientation,
): number {
  const targetDegrees = orientationToDegrees(targetOrientation)
  const interfaceDegrees = orientationToDegrees(interfaceOrientation)
  const rotation = (interfaceDegrees - targetDegrees) % 360

  if (rotation < -180) {
    return rotation + 360
  } else if (rotation > 180) {
    return rotation - 360
  } else {
    return rotation
  }
}
