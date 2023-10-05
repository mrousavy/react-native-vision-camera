import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo } from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { StyleSheet, View, Text, ListRenderItemInfo, SectionList, SectionListData } from 'react-native'
import { CameraDevice, useCameraDevices } from 'react-native-vision-camera'
import { CONTENT_SPACING, SAFE_AREA_PADDING } from './Constants'
import type { Routes } from './Routes'
import { PressableOpacity } from 'react-native-pressable-opacity'
import { usePreferredCameraDevice } from './hooks/usePreferredCameraDevice'

const keyExtractor = (item: CameraDevice): string => item.id

interface SectionType {
  position: CameraDevice['position'] | 'preferred'
}
type SectionData = SectionListData<CameraDevice, SectionType>

interface DeviceProps {
  device: CameraDevice
  onPress: () => void
}

function Device({ device, onPress }: DeviceProps): React.ReactElement {
  const maxPhotoRes = useMemo(
    () =>
      device.formats.reduce((prev, curr) => {
        if (curr.photoWidth * curr.photoHeight > prev.photoWidth * prev.photoHeight) return curr
        return prev
      }),
    [device.formats],
  )
  const maxVideoRes = useMemo(
    () =>
      device.formats.reduce((prev, curr) => {
        if (curr.videoWidth * curr.videoHeight > prev.videoWidth * prev.videoHeight) return curr
        return prev
      }),
    [device.formats],
  )
  const deviceTypes = useMemo(() => device.physicalDevices.map((t) => t.replace('-camera', '')).join(' + '), [device.physicalDevices])

  return (
    <PressableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={styles.horizontal}>
        <IonIcon name="camera" size={18} color="black" style={styles.icon} />
        <Text style={styles.deviceName} numberOfLines={3}>
          {device.name} <Text style={styles.devicePosition}>({device.position})</Text>
        </Text>
      </View>
      <Text style={styles.deviceTypes}>{deviceTypes}</Text>
      <View style={styles.horizontal}>
        <IonIcon name="camera" size={12} color="black" style={styles.inlineIcon} />
        <Text style={styles.resolutionText}>
          {maxPhotoRes.photoWidth}x{maxPhotoRes.photoHeight}
        </Text>
      </View>
      <View style={styles.horizontal}>
        <IonIcon name="videocam" size={12} color="black" style={styles.inlineIcon} />
        <Text style={styles.resolutionText}>
          {maxVideoRes.videoWidth}x{maxVideoRes.videoHeight} @ {maxVideoRes.maxFps} FPS
        </Text>
      </View>
      <Text style={styles.deviceId} numberOfLines={2} ellipsizeMode="middle">
        {device.id}
      </Text>
    </PressableOpacity>
  )
}

type Props = NativeStackScreenProps<Routes, 'Devices'>
export function DevicesPage({ navigation }: Props): React.ReactElement {
  const devices = useCameraDevices()
  const [preferredDevice, setPreferredDevice] = usePreferredCameraDevice()

  const sections = useMemo((): SectionData[] => {
    return [
      {
        position: 'preferred',
        data: preferredDevice != null ? [preferredDevice] : [],
      },
      {
        position: 'back',
        data: devices.filter((d) => d.position === 'back'),
      },
      {
        position: 'front',
        data: devices.filter((d) => d.position === 'front'),
      },
      {
        position: 'external',
        data: devices.filter((d) => d.position === 'external'),
      },
    ]
  }, [devices, preferredDevice])

  const onDevicePressed = useCallback(
    (device: CameraDevice) => {
      setPreferredDevice(device)
      navigation.navigate('CameraPage')
    },
    [navigation, setPreferredDevice],
  )

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CameraDevice>) => {
      return <Device device={item} onPress={() => onDevicePressed(item)} />
    },
    [onDevicePressed],
  )

  const renderSectionHeader = useCallback(({ section }: { section: SectionData }) => {
    if (section.data.length === 0) return null
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.position.toUpperCase()}</Text>
      </View>
    )
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.horizontal}>
          <PressableOpacity style={styles.backButton} onPress={navigation.goBack}>
            <IonIcon name="chevron-back" size={35} color="black" style={styles.icon} />
          </PressableOpacity>
          <Text style={styles.header}>Camera Devices</Text>
        </View>
        <Text style={styles.subHeader}>
          These are all detected Camera devices on your phone. This list will automatically update as you plug devices in or out.
        </Text>
      </View>

      <SectionList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerContainer: {
    paddingTop: SAFE_AREA_PADDING.paddingTop,
    paddingLeft: SAFE_AREA_PADDING.paddingLeft,
    paddingRight: SAFE_AREA_PADDING.paddingRight,
  },
  header: {
    fontSize: 38,
    fontWeight: 'bold',
    maxWidth: '80%',
  },
  subHeader: {
    marginTop: 10,
    fontSize: 18,
    maxWidth: '80%',
  },
  list: {
    marginTop: CONTENT_SPACING,
  },
  listContent: {
    paddingBottom: SAFE_AREA_PADDING.paddingBottom,
  },
  sectionHeader: {
    paddingHorizontal: CONTENT_SPACING / 2,
    paddingVertical: 5,
  },
  sectionHeaderText: {
    opacity: 0.4,
    fontSize: 16,
  },
  itemContainer: {
    paddingHorizontal: CONTENT_SPACING,
    paddingVertical: 7,
  },
  deviceName: {
    fontSize: 17,
    marginLeft: 5,
    flexShrink: 1,
    fontWeight: 'bold',
  },
  devicePosition: {
    opacity: 0.4,
  },
  deviceId: {
    fontSize: 12,
    opacity: 0.4,
  },
  deviceTypes: {
    fontSize: 12,
    opacity: 0.4,
  },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    marginTop: 7,
  },
  icon: {},
  inlineIcon: {},
  resolutionText: {
    marginLeft: 5,
    fontSize: 12,
  },
})
