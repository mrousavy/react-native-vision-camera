import { useCallback, useEffect, useRef } from 'react'
import { type GestureResponderEvent, StyleSheet, View } from 'react-native'
import {
  Camera,
  type CameraRef,
  type CameraViewProps,
} from 'react-native-vision-camera'

type Props = Omit<
  CameraViewProps,
  'ref' | 'style' | 'enableNativeZoomGesture' | 'enableNativeTapToFocusGesture'
>

export function CameraView({ device, constraints, ...props }: Props) {
  const camera = useRef<CameraRef>(null)

  useEffect(() => {
    if (typeof device === 'string') {
      console.log(`Device changed: "${device}"`)
    } else {
      console.log(`Device changed: ${device.localizedName}`)
      console.log(`  - Supported Pixel Formats:`, device.supportedPixelFormats)
      console.log(
        `  - Supported Photo Resolutions:`,
        device.getSupportedResolutions('photo'),
      )
      console.log(
        `  - Supported Video Resolutions:`,
        device.getSupportedResolutions('video'),
      )
      console.log(`  - Supported FPS Ranges:`, device.supportedFPSRanges)
      console.log(
        `  - Supported Dynamic Ranges:`,
        device.supportedVideoDynamicRanges,
      )
    }
  }, [device])

  const onPress = useCallback(async (event: GestureResponderEvent) => {
    if (camera.current == null) throw new Error(`Camera ref is not yet ready!`)

    const point = {
      x: event.nativeEvent.locationX,
      y: event.nativeEvent.locationY,
    }

    try {
      const start = performance.now()
      console.log(`Focusing to (${point.x}, ${point.y})...`)
      await camera.current.focusTo(point, {
        adaptiveness: 'continuous',
        autoResetAfter: 3,
        responsiveness: 'snappy',
      })
      const end = performance.now()
      console.log(`Focusing completed after ${(end - start).toFixed(2)}ms!`)
    } catch (error) {
      console.error(`Failed to focus!`, error)
    }
  }, [])

  return (
    <View style={styles.flex} onTouchEnd={onPress}>
      <Camera
        {...props}
        ref={camera}
        style={styles.camera}
        device={device}
        constraints={constraints}
        onSubjectAreaChanged={() => {
          console.log(`Subject Area Changed! Resetting Focus...`)
          camera.current?.resetFocus()
        }}
        onSessionConfigSelected={(config) => {
          console.log(`Given Constraints:`, constraints)
          console.log(`Resolved SessionConfig:`, config.toString())
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  camera: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
})
