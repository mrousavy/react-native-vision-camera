import { useEffect, useMemo, useState } from 'react';
import { Button, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { NitroModules } from 'react-native-nitro-modules';
import { clamp, useSharedValue } from 'react-native-reanimated';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory, HybridWorkletQueueFactory, useCameraDevices, CameraOutput, Camera } from 'react-native-vision-camera'
import { createWorkletRuntime, scheduleOnRuntime } from 'react-native-worklets';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function createVideoOutput(id: number): CameraOutput {
  const output = HybridCameraFactory.createFrameOutput('native')
  const thread = output.thread
  const queue = HybridWorkletQueueFactory.wrapThreadInQueue(thread)
  const runtime = createWorkletRuntime({
    name: `com.margelo.camera.frame-processor-${id}`,
    useDefaultQueue: false,
    customQueue: queue
  })
  output.setOnFrameDroppedCallback((reason) => {
    console.log(`Frame dropped - reason: ${reason}`)
  })
  const boxedOutput = NitroModules.box(output)
  scheduleOnRuntime(runtime, () => {
    'worklet'
    const unboxed = boxedOutput.unbox()
    unboxed.setOnFrameCallback((frame) => {
      // console.log(`New ${frame.width}x${frame.height} ${frame.pixelFormat} Frame arrived! (${frame.orientation})`)
      frame.dispose()
      return true
    })
  })
  return output
}

const supportsMulti = HybridCameraFactory.supportsMultiCamSessions

function AppContent() {
  const devices = useCameraDevices()
  const [isMulti, setIsMulti] = useState(false)
  const [zoom, setZoom] = useState(1)

  const device = useMemo(() => {
    const bestDevice = devices.reduce((prev, curr) => {
      let pointsVsPrev = 0

      // more devices = better
      pointsVsPrev += curr.constituentDevices.length - (prev?.constituentDevices.length ?? 0)

      // more depth data formats = better
      const totalDepthFormatsPrev = (prev?.formats ?? []).reduce((p, c) => {
        return Math.max(p, c.depthDataFormats.length)
      }, 0)
      const totalDepthFormatsCurr = curr.formats.reduce((p, c) => {
        return Math.max(p, c.depthDataFormats.length)
      }, 0)
      pointsVsPrev = totalDepthFormatsPrev - totalDepthFormatsCurr

      if (pointsVsPrev > 0) {
        return curr
      } else {
        return prev
      }
    }, devices[0])
    return bestDevice
  }, [devices])


  useEffect(() => {
    for (const device of devices) {
      console.log(`${device.id} ${device.formats[0]?.mediaType} ${device.formats[0]!.supportedColorSpaces[0]} ${device.formats[0]?.photoResolution.width} x ${device.formats[0]?.photoResolution.height} ("${device.localizedName}")`)
    }
  }, [devices])

  const videoOutput = useMemo(() => createVideoOutput(1), [])
  const photoOutput = useMemo(() => HybridCameraFactory.createPhotoOutput(), [])
  const outputs = useMemo(() => [videoOutput, photoOutput], [photoOutput, videoOutput])

  const savedScale = useSharedValue(1)
  const scale = useSharedValue(1)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(
        savedScale.value * e.scale,
        device?.minZoom ?? 1,
        device?.maxZoom ?? 1
      )
      setZoom(scale.value)
    })
    .onEnd(() => {
      savedScale.value = scale.value
    })
    .runOnJS(true)

  return (
    <View style={styles.container}>
      {devices.map((d) => (
        <Text key={d.id}>{d.id}</Text>
      ))}
      <GestureDetector gesture={pinchGesture}>
        <View style={styles.container}>
          {device != null && (
            <Camera
              style={styles.camera}
              input={device}
              outputs={outputs}
              configuration={{
                zoom: zoom
              }}
            />
          )}
        </View>
      </GestureDetector>
      {supportsMulti && (
        <Button
          title={`Switch to ${isMulti ? 'single-cam' : 'multi-cam'}`}
          onPress={() => setIsMulti((i) => !i)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    borderWidth: 1,
    borderColor: 'red',
    margin: 25,
    flex: 1
  }
});

export default App;
