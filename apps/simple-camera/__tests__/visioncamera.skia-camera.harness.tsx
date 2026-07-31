import { StyleSheet } from 'react-native'
import {
  afterEach,
  beforeAll,
  cleanup,
  describe,
  expect,
  it,
  render,
} from 'react-native-harness'
import type { CameraDevice, Size } from 'react-native-vision-camera'
import { CommonResolutions, VisionCamera } from 'react-native-vision-camera'
import { SkiaCamera } from 'react-native-vision-camera-skia'
import { provider as workletsProvider } from 'react-native-vision-camera-worklets'
import { scheduleOnRN } from 'react-native-worklets'
import { deferred, withTimeout } from './test-utils'

interface Edges {
  short: number
  long: number
}

function getEdges(size: Size): Edges {
  return {
    short: Math.min(size.width, size.height),
    long: Math.max(size.width, size.height),
  }
}

function supportsResolution(device: CameraDevice, size: Size): boolean {
  const target = getEdges(size)
  return device.getSupportedResolutions('video').some((resolution) => {
    const edges = getEdges(resolution)
    return edges.short === target.short && edges.long === target.long
  })
}

/**
 * Renders a `<SkiaCamera />` with the given `targetResolution` and resolves
 * with the dimensions of the first Frame it actually streams.
 */
async function streamFrameSize(
  device: CameraDevice,
  targetResolution: Size | undefined,
): Promise<Size> {
  const received = deferred<Size>()
  const report = (width: number, height: number) => {
    if (width > 0 && height > 0) received.resolve({ width, height })
  }

  await render(
    <SkiaCamera
      device={device}
      isActive={true}
      style={StyleSheet.absoluteFill}
      targetResolution={targetResolution}
      onError={received.reject}
      onFrame={(frame, renderFrame) => {
        'worklet'
        scheduleOnRN(report, frame.width, frame.height)
        renderFrame(({ frameTexture, canvas }) => {
          'worklet'
          canvas.drawImage(frameTexture, 0, 0)
        })
        frame.dispose()
      }}
    />,
  )

  try {
    return await withTimeout(
      received.promise,
      15_000,
      `SkiaCamera Frame at ${targetResolution?.width}x${targetResolution?.height}`,
    )
  } finally {
    cleanup()
  }
}

/**
 * Configures a bare `CameraFrameOutput` (the same primitive `<Camera />` uses)
 * with the given `targetResolution` and resolves with its negotiated resolution.
 */
async function nativeFrameOutputSize(
  device: CameraDevice,
  targetResolution: Size,
): Promise<Size> {
  const session = await VisionCamera.createCameraSession(false)
  const frameOutput = VisionCamera.createFrameOutput({
    targetResolution,
    pixelFormat: 'yuv',
    dropFramesWhileBusy: true,
    allowDeferredStart: false,
    enablePhysicalBufferRotation: false,
    enableCameraMatrixDelivery: false,
    enablePreviewSizedOutputBuffers: false,
  })
  await session.configure([
    {
      input: device,
      outputs: [{ output: frameOutput, mirrorMode: 'auto' }],
      constraints: [{ resolutionBias: frameOutput }],
    },
  ])

  const received = deferred<Size>()
  const report = (width: number, height: number) => {
    if (width > 0 && height > 0) received.resolve({ width, height })
  }
  const errorSub = session.addOnErrorListener(received.reject)

  const runtime = workletsProvider.createRuntimeForThread(frameOutput.thread)
  runtime.setOnFrameCallback(frameOutput, (frame) => {
    'worklet'
    scheduleOnRN(report, frame.width, frame.height)
    frame.dispose()
  })

  await session.start()
  try {
    return await withTimeout(
      received.promise,
      15_000,
      `CameraFrameOutput Frame at ${targetResolution.width}x${targetResolution.height}`,
    )
  } finally {
    runtime.setOnFrameCallback(frameOutput, undefined)
    errorSub.remove()
    await session.stop()
  }
}

describe('VisionCamera - SkiaCamera targetResolution', () => {
  let backDevice: CameraDevice

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    const factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    if (back == null) throw new Error('no back camera')
    backDevice = back
  })

  afterEach(() => {
    cleanup()
  })

  it('streams Frames at the requested targetResolution', async (context) => {
    const targetResolution = CommonResolutions.FHD_4_3
    if (!supportsResolution(backDevice, targetResolution)) {
      return context.skip(
        'FHD 4:3 video resolution not supported on this device',
      )
    }

    const streamed = await streamFrameSize(backDevice, targetResolution)

    expect(getEdges(streamed)).toEqual(getEdges(targetResolution))
  })

  it('falls back to the useFrameOutput default when targetResolution is omitted', async (context) => {
    const defaultResolution = CommonResolutions.HD_16_9
    if (!supportsResolution(backDevice, defaultResolution)) {
      return context.skip(
        'HD 16:9 video resolution not supported on this device',
      )
    }

    const streamed = await streamFrameSize(backDevice, undefined)

    expect(getEdges(streamed)).toEqual(getEdges(defaultResolution))
  })

  it('negotiates the same resolution as a bare CameraFrameOutput', async (context) => {
    const targetResolution = CommonResolutions.FHD_4_3
    if (!supportsResolution(backDevice, targetResolution)) {
      return context.skip(
        'FHD 4:3 video resolution not supported on this device',
      )
    }

    const skia = await streamFrameSize(backDevice, targetResolution)
    const native = await nativeFrameOutputSize(backDevice, targetResolution)

    expect(getEdges(skia)).toEqual(getEdges(native))
  })
})
