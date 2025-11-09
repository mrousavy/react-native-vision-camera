import { useEffect, useMemo, useRef } from 'react';
import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { PinchGesture } from 'react-native-gesture-handler/lib/typescript/handlers/gestures/pinchGesture';
import { NitroModules } from 'react-native-nitro-modules';
import { clamp, useSharedValue } from 'react-native-reanimated';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory, HybridWorkletQueueFactory, NativePreviewView, useCameraDevices } from 'react-native-vision-camera'
import { CameraDeviceController } from 'react-native-vision-camera/lib/specs/CameraDeviceController.nitro';
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

function AppContent() {
  const devices = useCameraDevices()
  const session = useMemo(() => HybridCameraFactory.createCameraSession(false), [])
  const previewFront = useMemo(() => HybridCameraFactory.createPreviewOutput(), [])
  const previewBack = useMemo(() => HybridCameraFactory.createPreviewOutput(), [])
  const controller = useRef<CameraDeviceController>(undefined)

  useEffect(() => {
    for (const device of devices) {
      console.log(`${device.id} ${device.formats[0].mediaType} ${device.formats[0]!.supportedColorSpaces[0]} ${device.formats[0].photoResolution.width} x ${device.formats[0].photoResolution.height} ("${device.localizedName}")`)
    }
  }, [devices])

  const createVideoOutput = () => {
    const output = HybridCameraFactory.createFrameOutput('native')
    const thread = output.thread
    const queue = HybridWorkletQueueFactory.wrapThreadInQueue(thread)
    const runtime = createWorkletRuntime({
      name: 'com.margelo.camera.frame-processor',
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

  const device = devices.find((d) => d.position === "back")

  useEffect(() => {
    if (device == null) return

    (async () => {
      try {
        const mark1 = performance.now()
        const photo = HybridCameraFactory.createPhotoOutput()
        const video = createVideoOutput()
        const [c] = await session.configure([
          {
            input: device,
            outputs: [previewBack, photo, video]
          },
        ])
        controller.current = c
        const mark2 = performance.now()
        console.log(`Configure took ${(mark2 - mark1).toFixed(0)}ms!`)
        console.log(controller)

        await session.start()
        const mark3 = performance.now()
        console.log(`Start took ${(mark3 - mark2).toFixed(0)}ms!`)

      } catch (e) {
        console.error(e)
      }
    })()
  }, [device, previewBack, previewFront, session])


  const savedScale = useSharedValue(1)
  const scale = useSharedValue(1)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      if (device == null) return
      scale.value = clamp(savedScale.value * e.scale, device.minZoom, device.maxZoom)
      controller.current?.configure(scale.value)
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
      {/* <NativePreviewView style={styles.camera} previewOutput={previewFront} /> */}
      <GestureDetector gesture={pinchGesture}>
        <NativePreviewView style={styles.camera} previewOutput={previewBack} />
      </GestureDetector>
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
