import { describe, expect, it } from 'react-native-harness'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'

describe('VisionCamera - createNormalizedMeteringPoint', () => {
  it('creates a MeteringPoint at the center', () => {
    const point = VisionCamera.createNormalizedMeteringPoint(0.5, 0.5)

    expect(point).toBeDefined()
    expect(point.relativeX).toBe(0.5)
    expect(point.relativeY).toBe(0.5)
  })

  it('creates a MeteringPoint at a corner', () => {
    const point = VisionCamera.createNormalizedMeteringPoint(0, 0)

    expect(point.relativeX).toBe(0)
    expect(point.relativeY).toBe(0)
  })

  it('creates a MeteringPoint with a custom size', () => {
    const point = VisionCamera.createNormalizedMeteringPoint(0.25, 0.75, 0.1)

    expect(point.relativeX).toBe(0.25)
    expect(point.relativeY).toBe(0.75)
    expect(point.relativeSize).toBe(0.1)
  })

  it('exposes normalized coordinates on the MeteringPoint', () => {
    const point = VisionCamera.createNormalizedMeteringPoint(0.5, 0.5, 0.2)

    expect(typeof point.normalizedX).toBe('number')
    expect(typeof point.normalizedY).toBe('number')
    expect(typeof point.normalizedSize).toBe('number')
  })
})

describe('VisionCamera - ZoomGestureController', () => {
  it('creates a new ZoomGestureController without a controller attached', () => {
    const gestureController = VisionCamera.createZoomGestureController()

    expect(gestureController).toBeDefined()
    expect(gestureController.controller).toBe(undefined)
  })

  it('allows setting the controller to undefined', () => {
    const gestureController = VisionCamera.createZoomGestureController()

    gestureController.controller = undefined
    expect(gestureController.controller).toBe(undefined)
  })
})

describe('VisionCamera - TapToFocusGestureController', () => {
  it('creates a new TapToFocusGestureController without a controller attached', () => {
    const gestureController = VisionCamera.createTapToFocusGestureController()

    expect(gestureController).toBeDefined()
    expect(gestureController.controller).toBe(undefined)
  })

  it('allows setting the controller to undefined', () => {
    const gestureController = VisionCamera.createTapToFocusGestureController()

    gestureController.controller = undefined
    expect(gestureController.controller).toBe(undefined)
  })
})

describe('VisionCamera - OrientationManager', () => {
  it("creates an OrientationManager with source 'interface'", () => {
    const manager = VisionCamera.createOrientationManager('interface')

    expect(manager).toBeDefined()
    expect(manager.source).toBe('interface')
  })

  it("creates an OrientationManager with source 'device'", () => {
    const manager = VisionCamera.createOrientationManager('device')

    expect(manager).toBeDefined()
    expect(manager.source).toBe('device')
  })

  it('starts and stops orientation updates', async () => {
    const manager = VisionCamera.createOrientationManager('interface')

    manager.startOrientationUpdates(() => {
      /* noop */
    })

    // give the system a tick to deliver the initial orientation if any
    await new Promise<void>((resolve) => setTimeout(resolve, 100))

    manager.stopOrientationUpdates()

    expect(manager).toBeDefined()
  })
})

describe('VisionCamera - FrameRenderer', () => {
  it('creates a new FrameRenderer', () => {
    const renderer = VisionCamera.createFrameRenderer()

    expect(renderer).toBeDefined()
    expect(typeof renderer.renderFrame).toBe('function')
  })

  it('creates distinct FrameRenderer instances on each call', () => {
    const first = VisionCamera.createFrameRenderer()
    const second = VisionCamera.createFrameRenderer()

    expect(first).not.toBe(second)
  })
})

describe('VisionCamera - CommonResolutions', () => {
  it('exposes all expected resolution tiers with positive dimensions', () => {
    const keys = Object.keys(
      CommonResolutions,
    ) as (keyof typeof CommonResolutions)[]
    for (const key of keys) {
      const resolution = CommonResolutions[key]

      expect(resolution.width).toBeGreaterThan(0)
      expect(resolution.height).toBeGreaterThan(0)
    }
  })

  it('has the expected common resolutions', () => {
    expect(CommonResolutions.VGA_16_9).toEqual({ width: 480, height: 854 })
    expect(CommonResolutions.VGA_4_3).toEqual({ width: 480, height: 640 })
    expect(CommonResolutions.HD_16_9).toEqual({ width: 720, height: 1280 })
    expect(CommonResolutions.FHD_16_9).toEqual({ width: 1080, height: 1920 })
    expect(CommonResolutions.UHD_16_9).toEqual({ width: 2160, height: 3840 })
    expect(CommonResolutions.UHD_4_3).toEqual({ width: 3024, height: 4032 })
  })
})
