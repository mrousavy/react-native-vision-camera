import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { NitroModules } from 'react-native-nitro-modules';
import { clamp, useSharedValue } from 'react-native-reanimated';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory, HybridWorkletQueueFactory, NativePreviewView, useCameraDevices, CameraDeviceController } from 'react-native-vision-camera'
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
  const [isMulti, setIsMulti] = useState(false)
  const session = useMemo(() => HybridCameraFactory.createCameraSession(true), [])
  const previewFront = useMemo(() => HybridCameraFactory.createPreviewOutput(), [])
  const previewBack = useMemo(() => HybridCameraFactory.createPreviewOutput(), [])
  const controllers = useRef<CameraDeviceController[]>([])
  const inputs = useMemo(() => {
    const result = [
      devices.find((d) => d.position === 'back')
    ]
    if (isMulti) {
      result.push(
        devices.find((d) => d.position === 'front'),
      )
    }
    return result.filter((d) => d != null)
  }, [devices, isMulti])

  useEffect(() => {
    for (const device of devices) {
      console.log(`${device.id} ${device.formats[0].mediaType} ${device.formats[0]!.supportedColorSpaces[0]} ${device.formats[0].photoResolution.width} x ${device.formats[0].photoResolution.height} ("${device.localizedName}")`)
    }
  }, [devices])

  const videoOutput = useMemo(() => {
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
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const mark1 = performance.now()
        const photo = HybridCameraFactory.createPhotoOutput()
        controllers.current = await session.configure(inputs.map((d) => ({
          input: d,
          outputs: d.position === 'front' ? [previewFront] : [previewBack]
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
  }, [inputs, previewBack, previewFront, session])


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
