import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { NitroModules } from 'react-native-nitro-modules';
import { clamp, useSharedValue } from 'react-native-reanimated';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory, HybridWorkletQueueFactory, NativePreviewView, useCameraDevices, CameraDeviceController, CameraOutput } from 'react-native-vision-camera'
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
      console.log(`New ${frame.width}x${frame.height} ${frame.pixelFormat} Frame arrived! (${frame.orientation})`)
      frame.dispose()
      return true
    })
  })
  return output
}

function AppContent() {
  const devices = useCameraDevices()
  const [isMulti, setIsMulti] = useState(false)
  const session = useMemo(() => HybridCameraFactory.createCameraSession(true), [])
  const previewFront = useMemo(() => HybridCameraFactory.createPreviewOutput(), [])
  const previewBack = useMemo(() => HybridCameraFactory.createPreviewOutput(), [])
  const controllers = useRef<CameraDeviceController[]>([])
  const inputs = useMemo(() => {
    if (isMulti) {
      const multiCamDevices = devices.filter((d) => d.formats.some((f) => f.supportsMultiCam))
      const back = multiCamDevices.find((d) => d.position === "back")
      const front = multiCamDevices.find((d) => d.position === "front")
      if (back != null && front != null) {
        return [back, front]
      }
    } else {
      const mostDevicesCam = devices.reduce((prev, curr) => {
        if (curr.constituentDevices.length > (prev?.constituentDevices.length ?? 0)) {
          return curr
        } else {
          return prev
        }
      }, devices[0])
      if (mostDevicesCam != null) {
        return [mostDevicesCam]
      }
    }
    const first = devices[0]
    if (first != null) {
      return [first]
    }
    return []
  }, [devices, isMulti])

  useEffect(() => {
    for (const device of devices) {
      console.log(`${device.id} ${device.formats[0]?.mediaType} ${device.formats[0]!.supportedColorSpaces[0]} ${device.formats[0]?.photoResolution.width} x ${device.formats[0]?.photoResolution.height} ("${device.localizedName}")`)
    }
  }, [devices])

  const videoOutputFront = useMemo(() => createVideoOutput(1), [])
  const videoOutputBack = useMemo(() => createVideoOutput(2), [])
  const photoOutput = useMemo(() => HybridCameraFactory.createPhotoOutput(), [])

  useEffect(() => {
    (async () => {
      try {
        const mark1 = performance.now()
        controllers.current = await session.configure(inputs.map((d) => ({
          input: d,
          outputs: d.position === 'front' ? [previewFront, videoOutputFront] : [previewBack, videoOutputBack, photoOutput]
        })))
        const mark2 = performance.now()
        console.log(`Configure took ${(mark2 - mark1).toFixed(0)}ms!`)

        await session.start()
        const mark3 = performance.now()
        console.log(`Start took ${(mark3 - mark2).toFixed(0)}ms!`)

      } catch (e) {
        console.error(e)
      }
    })()
  }, [inputs, photoOutput, previewBack, previewFront, session, videoOutputBack, videoOutputFront])


  const savedScale = useSharedValue(1)
  const scale = useSharedValue(1)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      controllers.current.forEach((c) => {
        scale.value = clamp(savedScale.value * e.scale, c.device.minZoom, c.device.maxZoom)
        c.configure({ zoom: scale.value })
      })
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
          {isMulti && (
            <NativePreviewView style={styles.camera} previewOutput={previewFront} />
          )}
          <NativePreviewView style={styles.camera} previewOutput={previewBack} />
        </View>
      </GestureDetector>
      <Button
        title={`Switch to ${isMulti ? 'single-cam' : 'multi-cam'}`}
        onPress={() => setIsMulti((i) => !i)} />
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
