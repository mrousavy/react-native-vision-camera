import { useEffect, useMemo, useState } from 'react';
import { Button, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { NitroModules } from 'react-native-nitro-modules';
import { clamp, useSharedValue } from 'react-native-reanimated';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory, HybridWorkletQueueFactory, useCameraDevices, CameraOutput, Camera, CameraDevice } from 'react-native-vision-camera'
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


function createVideoOutput(): CameraOutput {
  const output = HybridCameraFactory.createFrameOutput('native')
  const thread = output.thread
  const queue = HybridWorkletQueueFactory.wrapThreadInQueue(thread)
  const runtime = createWorkletRuntime({
    name: `com.margelo.camera.frame-processor`,
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
    let didLog = false
    unboxed.setOnFrameCallback((frame) => {
      if (!didLog) {
        console.log(`New ${frame.width}x${frame.height} ${frame.pixelFormat} Frame arrived! (${frame.orientation})`)
        didLog = true
      }
      frame.dispose()
      return true
    })
  })
  return output
}
function createDepthOutput(): CameraOutput {
  const output = HybridCameraFactory.createDepthFrameOutput('native')
  const thread = output.thread
  const queue = HybridWorkletQueueFactory.wrapThreadInQueue(thread)
  const runtime = createWorkletRuntime({
    name: `com.margelo.camera.frame-processor`,
    useDefaultQueue: false,
    customQueue: queue
  })
  output.setOnDepthFrameDroppedCallback((reason) => {
    console.log(`Frame dropped - reason: ${reason}`)
  })
  const boxedOutput = NitroModules.box(output)
  scheduleOnRuntime(runtime, () => {
    'worklet'
    const unboxed = boxedOutput.unbox()
    let didLog = false
    unboxed.setOnDepthFrameCallback((depth) => {
      if (!didLog) {
        console.log(`New ${depth.width}x${depth.height} ${depth.pixelFormat} Depth arrived! (${depth.orientation})`)
        didLog = true
      }
      depth.dispose()
      return true
    })
  })
  return output
}

function AppContent() {
  const devices = useCameraDevices()
  const [position, setPosition] = useState<CameraDevice["position"]>("back")
  const [zoom, setZoom] = useState(1)

  const device = useMemo(() => {
    const filtered = devices.filter((d) => d.position === position)
    const bestDevice = filtered.reduce((prev, curr) => {
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
      pointsVsPrev += totalDepthFormatsCurr - totalDepthFormatsPrev

      if (pointsVsPrev > 0) {
        return curr
      } else {
        return prev
      }
    }, devices[0])
    return bestDevice
  }, [devices, position])

  if (device != null) {
    console.log(`Device: ${device.id} (${device.localizedName})`)
  } else {
    console.log(`No device at ${position}!`)
  }


  useEffect(() => {
    for (const d of devices) {
      console.log(`${d.id} ${d.formats[0]?.mediaType} ${d.formats[0]!.supportedColorSpaces[0]} ${d.formats[0]?.photoResolution.width} x ${d.formats[0]?.photoResolution.height} ("${d.localizedName}")`)
    }
  }, [devices])

  const videoOutput = useMemo(() => createVideoOutput(), [])
  const depthOutput = useMemo(() => createDepthOutput(), [])
  const photoOutput = useMemo(() => HybridCameraFactory.createPhotoOutput(), [])
  const outputs = useMemo(() => [videoOutput, photoOutput, depthOutput], [photoOutput, videoOutput, depthOutput])

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
      <Button
        title={`Flip to ${device?.position === 'front' ? 'back' : 'front'}`}
        onPress={() => setPosition((p) => p === "front" ? 'back' : 'front')} />
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
