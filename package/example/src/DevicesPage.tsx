import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo } from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { StyleSheet, View, Text, ListRenderItemInfo, SectionList, SectionListData } from 'react-native'
import { CameraDevice, useCameraDevices } from 'react-native-vision-camera'
import { CONTENT_SPACING, SAFE_AREA_PADDING } from './Constants'
import type { Routes } from './Routes'
import { PressableOpacity } from 'react-native-pressable-opacity'

const keyExtractor = (item: CameraDevice): string => item.id

interface SectionType {
  position: CameraDevice['position']
}
type SectionData = SectionListData<CameraDevice, SectionType>

type Props = NativeStackScreenProps<Routes, 'Devices'>
export function DevicesPage({ navigation }: Props): React.ReactElement {
  const devices = useCameraDevices()

  const sections = useMemo((): SectionData[] => {
    return [
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
  }, [devices])

  const renderItem = useCallback(({ item: device }: ListRenderItemInfo<CameraDevice>) => {
    return (
      <PressableOpacity style={styles.itemContainer}>
        <View style={styles.horizontal}>
          <IonIcon name="camera" size={18} color="black" style={styles.icon} />
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceTypes}>({device.physicalDevices.join(' + ')})</Text>
        </View>
        <Text style={styles.deviceId}>{device.id}</Text>
      </PressableOpacity>
    )
  }, [])

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
    ...SAFE_AREA_PADDING,
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
  list: {},
  listContent: {
    paddingTop: CONTENT_SPACING,
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
  },
  deviceId: {
    fontSize: 12,
    opacity: 0.4,
  },
  deviceTypes: {
    fontSize: 14,
    marginLeft: 7,
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
})
