import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
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
  OrientationSource,
  TargetCameraPosition,
} from 'react-native-vision-camera'
import {
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

interface CameraUIRotationProbeProps {
  orientationSource: OrientationSource | 'custom'
  onInterfaceOrientationChanged: (
    orientation: CameraOrientation | undefined,
  ) => void
  onUIRotationChanged: (rotation: number) => void
  onError: (error: Error) => void
}

interface CameraUIRotationDriverProps extends CameraUIRotationProbeProps {
  screenOrientation: ScreenOrientationTypes
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

function CameraUIRotationProbe({
  orientationSource,
  onInterfaceOrientationChanged,
  onUIRotationChanged,
  onError,
}: CameraUIRotationProbeProps): null {
  const interfaceOrientation = useOrientation('interface')
  const previewOutput = usePreviewOutput()

  useEffect(() => {
    onInterfaceOrientationChanged(interfaceOrientation)
  }, [interfaceOrientation, onInterfaceOrientationChanged])

  useCamera({
    isActive: false,
    device: 'back',
    outputs: [previewOutput],
    orientationSource,
    onUIRotationChanged,
    onError,
  })

  return null
}

function CameraUIRotationDriver({
  screenOrientation,
  ...probeProps
}: CameraUIRotationDriverProps): React.ReactElement {
  return (
    <ScreenStack style={styles.fill}>
      <Screen
        enabled={true}
        activityState={2}
        screenOrientation={screenOrientation}
        style={styles.fill}
      >
        <View style={styles.fill}>
          <CameraUIRotationProbe {...probeProps} />
        </View>
      </Screen>
    </ScreenStack>
  )
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

async function expectLatestUIRotation(
  onInterfaceOrientationChanged: Mock<
    (orientation: CameraOrientation | undefined) => void
  >,
  onUIRotationChanged: Mock<(rotation: number) => void>,
  allowedOrientations: readonly CameraOrientation[],
  previousOrientation?: CameraOrientation,
): Promise<CameraOrientation> {
  let observedOrientation: CameraOrientation | undefined
  await waitFor(
    () => {
      const latestOrientation = onInterfaceOrientationChanged.mock.lastCall?.[0]
      if (latestOrientation == null) {
        throw new Error('No interface orientation was observed yet.')
      }
      observedOrientation = latestOrientation
      expect(allowedOrientations).toContain(latestOrientation)
      if (previousOrientation != null) {
        expect(latestOrientation).not.toBe(previousOrientation)
      }
      expect(onUIRotationChanged).toHaveBeenLastCalledWith(
        uiRotationDegrees[latestOrientation],
      )
    },
    { timeout: 10_000 },
  )
  if (observedOrientation == null) {
    throw new Error('No interface orientation was observed.')
  }
  return observedOrientation
}

const uiRotationDegrees = {
  up: 0,
  right: 90,
  down: 180,
  left: -90,
} as const satisfies Record<CameraOrientation, number>

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

  it('calls onUIRotationChanged with the current UI rotation', async () => {
    const onInterfaceOrientationChanged =
      fn<(orientation: CameraOrientation | undefined) => void>()
    const onUIRotationChanged = fn<(rotation: number) => void>()
    const onError = fn<(error: Error) => void>()

    await render(
      <CameraUIRotationDriver
        screenOrientation="portrait_up"
        orientationSource="custom"
        onInterfaceOrientationChanged={onInterfaceOrientationChanged}
        onUIRotationChanged={onUIRotationChanged}
        onError={onError}
      />,
      { timeout: 10_000 },
    )

    await expectLatestUIRotation(
      onInterfaceOrientationChanged,
      onUIRotationChanged,
      ['up'],
    )
    expect(onError).not.toHaveBeenCalled()
  })

  it('updates onUIRotationChanged when the interface orientation changes', async () => {
    const onInterfaceOrientationChanged =
      fn<(orientation: CameraOrientation | undefined) => void>()
    const onUIRotationChanged = fn<(rotation: number) => void>()
    const onError = fn<(error: Error) => void>()
    const renderDriver = (screenOrientation: ScreenOrientationTypes) => (
      <CameraUIRotationDriver
        screenOrientation={screenOrientation}
        orientationSource="custom"
        onInterfaceOrientationChanged={onInterfaceOrientationChanged}
        onUIRotationChanged={onUIRotationChanged}
        onError={onError}
      />
    )

    const { rerender } = await render(renderDriver('portrait_up'), {
      timeout: 10_000,
    })
    await expectLatestUIRotation(
      onInterfaceOrientationChanged,
      onUIRotationChanged,
      ['up'],
    )

    onInterfaceOrientationChanged.mockClear()
    onUIRotationChanged.mockClear()
    await rerender(renderDriver('landscape_left'))
    const firstLandscapeOrientation = await expectLatestUIRotation(
      onInterfaceOrientationChanged,
      onUIRotationChanged,
      ['left', 'right'],
    )

    onInterfaceOrientationChanged.mockClear()
    onUIRotationChanged.mockClear()
    await rerender(renderDriver('landscape_right'))
    await expectLatestUIRotation(
      onInterfaceOrientationChanged,
      onUIRotationChanged,
      ['left', 'right'],
      firstLandscapeOrientation,
    )

    onInterfaceOrientationChanged.mockClear()
    onUIRotationChanged.mockClear()
    await rerender(renderDriver('portrait_up'))
    await expectLatestUIRotation(
      onInterfaceOrientationChanged,
      onUIRotationChanged,
      ['up'],
    )
    expect(onError).not.toHaveBeenCalled()
  })
})

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
})
