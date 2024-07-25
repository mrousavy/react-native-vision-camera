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
  let point = normalizePoint(sourcePoint, coordinateSystem)
  point = rotatePoint(point, matrix.orientation)
  point = mirrorPoint(point, matrix.isMirrored)
  return point
}

function normalizePoint(point: Point, coordinateSystem: SourceCoordinateSystem): Point {
  return {
    x: point.x / coordinateSystem.width,
    y: point.y / coordinateSystem.height,
  }
}

function rotatePoint(point: Point, orientation: Orientation): Point {
  switch (orientation) {
    case 'portrait':
      return point
    case 'portrait-upside-down':
      return {
        x: 1 - point.x,
        y: 1 - point.y,
      }
    case 'landscape-left':
      return {
        x: point.y,
        y: 1 - point.x,
      }
    case 'landscape-right':
      return {
        x: point.y,
        y: 1 - point.x,
      }
  }
}

function mirrorPoint(point: Point, isMirrored: boolean): Point {
  if (isMirrored) {
    // Mirror point on X axis
    return {
      x: 1 - point.x,
      y: point.y,
    }
  } else {
    // No mirroring
    return point
  }
}
