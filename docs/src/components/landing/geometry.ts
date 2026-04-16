import {
  FOCUS_HIT_TEST,
  FRONT_LAYER_BIAS_END_ASPECT_RATIO,
  FRONT_LAYER_BIAS_START_ASPECT_RATIO,
  FRONT_LAYER_MIN_OBJECT_POSITION_X_PERCENT,
  FRONT_LAYER_OFFSET_Y_PERCENT,
  IMAGE_LAYER_SCALE,
  type Offset,
} from '@/components/landing/constants'

export function clamp(value: number, max: number) {
  return Math.max(-max, Math.min(max, value))
}

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function easeInOutSine(value: number) {
  return -(Math.cos(Math.PI * value) - 1) / 2
}

export function getFrontLayerObjectPositionXPercent(
  containerAspectRatio: number | null,
) {
  if (
    containerAspectRatio == null ||
    !Number.isFinite(containerAspectRatio) ||
    containerAspectRatio <= 0
  ) {
    return 50
  }

  const rawProgress = clamp01(
    (FRONT_LAYER_BIAS_START_ASPECT_RATIO - containerAspectRatio) /
      (FRONT_LAYER_BIAS_START_ASPECT_RATIO - FRONT_LAYER_BIAS_END_ASPECT_RATIO),
  )
  const biasProgress = easeInOutSine(rawProgress)

  return 50 - biasProgress * (50 - FRONT_LAYER_MIN_OBJECT_POSITION_X_PERCENT)
}

function getObjectCoverLocalCoordinate(
  normalizedValue: number,
  axis: 'x' | 'y',
  containerAspectRatio: number,
  imageAspectRatio: number,
  objectPosition: number,
) {
  const value = clamp01(normalizedValue)

  if (
    !Number.isFinite(containerAspectRatio) ||
    containerAspectRatio <= 0 ||
    !Number.isFinite(imageAspectRatio) ||
    imageAspectRatio <= 0
  ) {
    return value
  }

  if (axis === 'x') {
    if (containerAspectRatio >= imageAspectRatio) {
      return value
    }

    const visibleFraction = containerAspectRatio / imageAspectRatio
    const start = (1 - visibleFraction) * objectPosition
    return clamp01(start + value * visibleFraction)
  }

  if (containerAspectRatio <= imageAspectRatio) {
    return value
  }

  const visibleFraction = imageAspectRatio / containerAspectRatio
  const start = (1 - visibleFraction) * objectPosition
  return clamp01(start + value * visibleFraction)
}

function getForegroundBoundaryY(normalizedX: number) {
  const x = clamp01(normalizedX)
  const boundary = FOCUS_HIT_TEST.foregroundBoundary

  for (let index = 1; index < boundary.length; index += 1) {
    const previousPoint = boundary[index - 1]
    const nextPoint = boundary[index]

    if (x <= nextPoint.x) {
      const segmentProgress =
        (x - previousPoint.x) / (nextPoint.x - previousPoint.x)
      return previousPoint.y + (nextPoint.y - previousPoint.y) * segmentProgress
    }
  }

  return boundary[boundary.length - 1].y
}

function getFrontLayerLocalPoint(
  normalizedX: number,
  normalizedY: number,
  width: number,
  height: number,
  frontOffset: Offset,
  frontLayerObjectPositionXPercent: number,
) {
  if (width <= 0 || height <= 0) {
    return {
      x: clamp01(normalizedX),
      y: clamp01(normalizedY),
    }
  }

  const offsetX = frontOffset.x / width
  const offsetY = frontOffset.y / height + FRONT_LAYER_OFFSET_Y_PERCENT / 100
  const containerAspectRatio = width / height
  const layerX = clamp01(
    0.5 + (normalizedX - 0.5 - offsetX) / IMAGE_LAYER_SCALE,
  )
  const layerY = clamp01(
    0.5 + (normalizedY - 0.5 - offsetY) / IMAGE_LAYER_SCALE,
  )

  return {
    x: getObjectCoverLocalCoordinate(
      layerX,
      'x',
      containerAspectRatio,
      FRONT_LAYER_BIAS_START_ASPECT_RATIO,
      frontLayerObjectPositionXPercent / 100,
    ),
    y: getObjectCoverLocalCoordinate(
      layerY,
      'y',
      containerAspectRatio,
      FRONT_LAYER_BIAS_START_ASPECT_RATIO,
      0.5,
    ),
  }
}

export function isForegroundHit(
  normalizedX: number,
  normalizedY: number,
  width: number,
  height: number,
  frontOffset: Offset,
  frontLayerObjectPositionXPercent: number,
) {
  const localPoint = getFrontLayerLocalPoint(
    normalizedX,
    normalizedY,
    width,
    height,
    frontOffset,
    frontLayerObjectPositionXPercent,
  )

  return localPoint.y >= getForegroundBoundaryY(localPoint.x)
}
