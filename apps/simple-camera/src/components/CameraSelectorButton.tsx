import {
  type MenuAction,
  MenuView,
  type NativeActionEvent,
} from '@react-native-menu/menu'
import type React from 'react'
import { useCallback, useMemo } from 'react'
import type { CameraDevice, CameraPosition } from 'react-native-vision-camera'
import { IconButton } from './IconButton'

interface Props {
  devices: CameraDevice[]
  setDevice: (device: CameraDevice) => void
}

export function CameraSelectorButton({
  devices,
  setDevice,
}: Props): React.ReactElement {
  const menuActions = useMemo<MenuAction[]>(() => {
    const positions = ['back', 'front', 'external'].filter<CameraPosition>(
      (p): p is CameraPosition => devices.some((d) => d.position === p),
    )
    return positions.map((pos) => {
      const devicesAtPosition = devices.filter((d) => d.position === pos)
      return {
        title: pos,
        preferredElementSize: 'small',
        displayInline: true,
        subactions: devicesAtPosition.map((d) => {
          return {
            id: d.id,
            subtitle: d.mediaTypes.join(' + '),
            title: d.localizedName,
          }
        }),
      }
    })
  }, [devices])

  const onMenuItemPressed = useCallback(
    (event: NativeActionEvent) => {
      const cameraId = event.nativeEvent.event
      const targetDevice = devices.find((d) => d.id === cameraId)
      if (targetDevice != null) {
        setDevice(targetDevice)
      }
    },
    [devices, setDevice],
  )

  return (
    <MenuView actions={menuActions} onPressAction={onMenuItemPressed}>
      <IconButton iconName="camera" onPress={() => {}} />
    </MenuView>
  )
}
