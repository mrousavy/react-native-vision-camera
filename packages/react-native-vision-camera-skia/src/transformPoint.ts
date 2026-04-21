import type { CameraOrientation, Point } from 'react-native-vision-camera'

export interface Transform {
  orientation: CameraOrientation
  isMirrored: boolean
}

/**
 * Transforms the given {@linkcode normalizedPoint}
 * (values ranging from `0...1`) using the
 * given {@linkcode orientation} and {@linkcode isMirrored}
 */
export function transformPoint(
  normalizedPoint: Point,
  { orientation, isMirrored }: Transform,
): Point {
  let result = normalizedPoint

  if (isMirrored) {
    // Mirror alongside X first
    result = { x: 1 - result.x, y: result.y }
  }

  // Now rotate to camera coordinate system
  switch (orientation) {
    case 'up':
      // no rotation
      break
    case 'down':
      result = { x: 1 - result.x, y: 1 - result.y }
      break
    case 'left':
      result = { x: result.y, y: 1 - result.x }
      break
    case 'right':
      result = { x: 1 - result.y, y: result.x }
      break
  }

  return result
}
