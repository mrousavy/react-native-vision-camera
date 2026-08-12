import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import {
  beforeAll,
  describe,
  expect,
  fn,
  it,
  type Mock,
  render,
  waitFor,
} from 'react-native-harness'
import {
  Screen,
  type ScreenOrientationTypes,
  ScreenStack,
} from 'react-native-screens'
import type {
  CameraDevice,
  CameraDeviceFactory,
  CameraOrientation,
  CameraPosition,
  DeviceFilter,
  TargetCameraPosition,
} from 'react-native-vision-camera'
import {
  getUIRotation,
  useCamera,
  useCameraDevice,
  useOrientation,
  usePreviewOutput,
  VisionCamera,
} from 'react-native-vision-camera'

interface DeviceSnapshot {
  requestedPosition: TargetCameraPosition
  deviceId: string | undefined
  devicePosition: CameraPosition | undefined
}

interface CameraDeviceProbeProps {
  position: TargetCameraPosition
  filter?: DeviceFilter
  onSnapshot: (snapshot: DeviceSnapshot) => void
}

const cameraPositions: TargetCameraPosition[] = ['back', 'front', 'external']
const tripleCameraFilter = {
  physicalDevices: ['ultra-wide-angle', 'wide-angle', 'telephoto'],
} satisfies DeviceFilter
const wideCameraFilter = {
  physicalDevices: ['wide-angle'],
} satisfies DeviceFilter

function getExpectedCameraDevice(
  factory: CameraDeviceFactory,
  position: TargetCameraPosition,
  filter: DeviceFilter = {},
): CameraDevice | undefined {
  if (Object.values(filter).length === 0) {
    const defaultCamera = factory.getDefaultCamera(position)
    if (defaultCamera != null) return defaultCamera
  }

  return factory.cameraDevices
    .filter((device) => device.position === position)
    .reduce<CameraDevice | undefined>((previous, current) => {
      if (previous == null) return current

      const physicalDevicesFilter: string[] = filter.physicalDevices ?? [
        'wide-angle',
      ]
      const previousPoints = previous.physicalDevices.reduce(
        (points, physicalDevice) =>
          physicalDevicesFilter.includes(physicalDevice.type)
            ? points + 1
            : points - 1,
        0,
      )
      const currentPoints = current.physicalDevices.reduce(
        (points, physicalDevice) =>
          physicalDevicesFilter.includes(physicalDevice.type)
            ? points + 1
            : points - 1,
        0,
      )

      return currentPoints > previousPoints ? current : previous
    }, undefined)
}

function CameraDeviceProbe({
  position,
  filter,
  onSnapshot,
}: CameraDeviceProbeProps): null {
  const device = useCameraDevice(position, filter)

  useEffect(() => {
    onSnapshot({
      requestedPosition: position,
      deviceId: device?.id,
      devicePosition: device?.position,
    })
  }, [position, device, onSnapshot])

  return null
}

async function expectLatestDeviceSnapshot(
  onSnapshot: Mock<(snapshot: DeviceSnapshot) => void>,
  position: TargetCameraPosition,
  expectedDevice: CameraDevice | undefined,
): Promise<void> {
  await waitFor(
    () => {
      expect(onSnapshot).toHaveBeenLastCalledWith({
        requestedPosition: position,
        deviceId: expectedDevice?.id,
        devicePosition: expectedDevice?.position,
      })
    },
    { timeout: 10_000 },
  )
}

describe('VisionCamera - Hooks', () => {
  let factory: CameraDeviceFactory

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    factory = await VisionCamera.createDeviceFactory()
  })

  it('updates useCameraDevice when the requested position changes', async () => {
    const onSnapshot = fn<(snapshot: DeviceSnapshot) => void>()

    const { rerender } = await render(
      <CameraDeviceProbe position="back" onSnapshot={onSnapshot} />,
    )

    for (const position of cameraPositions) {
      if (position !== 'back') {
        await rerender(
          <CameraDeviceProbe position={position} onSnapshot={onSnapshot} />,
        )
      }

      await expectLatestDeviceSnapshot(
        onSnapshot,
        position,
        getExpectedCameraDevice(factory, position),
      )
    }
  })

  it('updates useCameraDevice when the requested position changes with a physical-device filter', async () => {
    const onSnapshot = fn<(snapshot: DeviceSnapshot) => void>()

    const { rerender } = await render(
      <CameraDeviceProbe
        position="back"
        filter={tripleCameraFilter}
        onSnapshot={onSnapshot}
      />,
    )

    for (const position of cameraPositions) {
      if (position !== 'back') {
        await rerender(
          <CameraDeviceProbe
            position={position}
            filter={tripleCameraFilter}
            onSnapshot={onSnapshot}
          />,
        )
      }

      await expectLatestDeviceSnapshot(
        onSnapshot,
        position,
        getExpectedCameraDevice(factory, position, tripleCameraFilter),
      )
    }
  })

  it('updates useCameraDevice when the physical-device filter changes', async (context) => {
    const wideDevice = getExpectedCameraDevice(
      factory,
      'back',
      wideCameraFilter,
    )
    const tripleDevice = getExpectedCameraDevice(
      factory,
      'back',
      tripleCameraFilter,
    )

    if (wideDevice == null || tripleDevice == null) {
      return context.skip(
        'filtered back cameras: none available on this device',
      )
    }
    if (wideDevice.id === tripleDevice.id) {
      return context.skip(
        'filtered back cameras: wide-angle and triple filters select the same device',
      )
    }

    const onSnapshot = fn<(snapshot: DeviceSnapshot) => void>()

    const { rerender } = await render(
      <CameraDeviceProbe
        position="back"
        filter={wideCameraFilter}
        onSnapshot={onSnapshot}
      />,
    )
    await expectLatestDeviceSnapshot(onSnapshot, 'back', wideDevice)

    await rerender(
      <CameraDeviceProbe
        position="back"
        filter={tripleCameraFilter}
        onSnapshot={onSnapshot}
      />,
    )
    await expectLatestDeviceSnapshot(onSnapshot, 'back', tripleDevice)
  })

  it('updates onUIRotationChanged when the interface orientation changes', async () => {
    const onConfigured = fn<() => void>()
    const onInterfaceOrientationChanged =
      fn<(orientation: CameraOrientation | undefined) => void>()
    const onUIRotationChanged = fn<(rotation: number) => void>()
    const onError = fn<(error: Error) => void>()

    function TestCamera({
      screenOrientation,
    }: {
      screenOrientation: ScreenOrientationTypes
    }): React.ReactElement {
      // CameraX requires at least one use case when configuring a session.
      const previewOutput = usePreviewOutput()
      const interfaceOrientation = useOrientation('interface')
      useEffect(() => {
        onInterfaceOrientationChanged(interfaceOrientation)
      }, [interfaceOrientation])
      useCamera({
        isActive: false,
        device: 'back',
        outputs: [previewOutput],
        orientationSource: 'custom',
        onConfigured,
        onUIRotationChanged,
        onError,
      })

      return (
        <ScreenStack style={StyleSheet.absoluteFill}>
          <Screen
            enabled={true}
            activityState={2}
            screenOrientation={screenOrientation}
            style={StyleSheet.absoluteFill}
          />
        </ScreenStack>
      )
    }

    const waitForRotation = async (
      allowedOrientations: readonly CameraOrientation[],
    ): Promise<CameraOrientation> => {
      let receivedOrientation: CameraOrientation | undefined
      await waitFor(
        () => {
          const error = onError.mock.lastCall?.[0]
          if (error != null) throw error

          const orientation = onInterfaceOrientationChanged.mock.lastCall?.[0]
          if (orientation == null) {
            throw new Error('No interface orientation was received yet.')
          }
          receivedOrientation = orientation
          expect(allowedOrientations).toContain(orientation)
          const expectedRotation = getUIRotation('up', orientation)
          expect(onUIRotationChanged).toHaveBeenLastCalledWith(expectedRotation)
        },
        { timeout: 10_000 },
      )
      if (receivedOrientation == null) {
        throw new Error('No interface orientation was received.')
      }
      return receivedOrientation
    }

    const { rerender } = await render(
      <TestCamera screenOrientation="portrait_up" />,
      {
        timeout: 10_000,
      },
    )
    await waitFor(
      () => {
        const error = onError.mock.lastCall?.[0]
        if (error != null) throw error
        expect(onConfigured).toHaveBeenCalledTimes(1)
      },
      { timeout: 10_000 },
    )
    await waitFor(
      () => {
        const error = onError.mock.lastCall?.[0]
        if (error != null) throw error
        const expectedRotation = getUIRotation('up', 'up')
        expect(onUIRotationChanged).toHaveBeenLastCalledWith(expectedRotation)
      },
      { timeout: 10_000 },
    )

    try {
      onInterfaceOrientationChanged.mockClear()
      onUIRotationChanged.mockClear()
      await rerender(<TestCamera screenOrientation="landscape_left" />)
      const firstLandscapeOrientation = await waitForRotation(['left', 'right'])
      const oppositeLandscapeOrientation =
        firstLandscapeOrientation === 'left' ? 'right' : 'left'
      onInterfaceOrientationChanged.mockClear()
      onUIRotationChanged.mockClear()
      await rerender(<TestCamera screenOrientation="landscape_right" />)
      await waitForRotation([oppositeLandscapeOrientation])

      onInterfaceOrientationChanged.mockClear()
      onUIRotationChanged.mockClear()
      await rerender(<TestCamera screenOrientation="portrait_up" />)
      await waitForRotation(['up'])
    } finally {
      await rerender(<TestCamera screenOrientation="portrait_up" />)
    }

    expect(onError).not.toHaveBeenCalled()
  })
})
