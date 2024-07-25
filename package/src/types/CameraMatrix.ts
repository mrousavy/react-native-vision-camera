import type { Orientation } from './Orientation'
import type { Point } from './Point'

export interface CameraMatrix {
  orientation: Orientation
  isMirrored: boolean
  width: number
  height: number
}

interface SourceCoordinateSystem {
  width: number
  height: number
}

export function convertPoint(sourcePoint: Point, coordinateSystem: SourceCoordinateSystem, matrix: CameraMatrix): Point {
  let point = scalePoint(sourcePoint, coordinateSystem, matrix)
  point = rotatePoint(point, matrix)
  point = mirrorPoint(point, matrix)
  return point
}

function scalePoint(point: Point, from: SourceCoordinateSystem, to: SourceCoordinateSystem): Point {
  return {
    x: (point.x / from.width) * to.width,
    y: (point.y / from.height) * to.height,
  }
}

function rotatePoint(point: Point, matrix: CameraMatrix): Point {
  switch (matrix.orientation) {
    case 'portrait':
      return point
    case 'portrait-upside-down':
      return {
        x: matrix.width - point.x,
        y: matrix.height - point.y,
      }
    case 'landscape-left':
      return {
        x: point.y,
        y: matrix.height - point.x,
      }
    case 'landscape-right':
      return {
        x: point.y,
        y: point.x,
      }
  }
}

function mirrorPoint(point: Point, matrix: CameraMatrix): Point {
  if (matrix.isMirrored) {
    // Mirror point on X axis
    return {
      x: matrix.width - point.x,
      y: point.y,
    }
  } else {
    // No mirroring
    return point
  }
}
