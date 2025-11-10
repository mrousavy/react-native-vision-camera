import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { callback, HybridRef, NitroModules } from 'react-native-nitro-modules';
import { BoxedHybridObject } from 'react-native-nitro-modules/lib/typescript/BoxedHybridObject';
import { clamp, useSharedValue } from 'react-native-reanimated';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory, useCameraDevices, CameraOutput, Camera, NativeFrameRendererView, FrameRendererViewProps, FrameRendererViewMethods,  useFrameOutput, Frame, Depth, useDepthOutput } from 'react-native-vision-camera'

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

type RefType = HybridRef<FrameRendererViewProps, FrameRendererViewMethods>

function AppContent() {
  const devices = useCameraDevices()
  const [deviceIndex, setDeviceIndex] = useState(0)
  const [rendererBoxed, setRendererBoxed] = useState<BoxedHybridObject<RefType> | undefined>(undefined)
  let nextDeviceIndex = deviceIndex + 1
  if (nextDeviceIndex >= devices.length) {
    nextDeviceIndex = 0
  }

  const device = devices[deviceIndex]
  const [zoom, setZoom] = useState(1)

  if (device != null) {
    console.log(`Device: ${device.id} (${device.localizedName})`)
  } else {
    console.log(`No device!`)
  }

  useEffect(() => {
    for (const d of devices) {
      console.log(`${d.id} ${d.formats[0]?.mediaType} ${d.formats[0]!.supportedColorSpaces[0]} ${d.formats[0]?.photoResolution.width} x ${d.formats[0]?.photoResolution.height} ("${d.localizedName}")`)
    }
  }, [devices])

  const onFrame = useCallback((frame: Frame) => {
    'worklet'
      console.log(`Running on ${frame.width}x${frame.height} ${frame.pixelFormat} Frame!`)
      frame.dispose()
  }, [rendererBoxed])
  const onDepth = useCallback((depth: Depth) => {
    'worklet'
      console.log(`Running on ${depth.width}x${depth.height} ${depth.pixelFormat} Depth!`)
      const renderer = rendererBoxed?.unbox()
      if (renderer != null) {
        const frame = depth.toFrame()
        renderer.renderFrame(frame)
      }
      depth.dispose()
  }, [rendererBoxed])

  const frameOutput = useFrameOutput({
    onFrame: onFrame
  })
  const depthOutput = useDepthOutput({
    onDepth: onDepth
  })
  const photoOutput = useMemo(() => HybridCameraFactory.createPhotoOutput(), [])
  const supportsDepth = useMemo(() => {
    if (device == null) return false
    return device.formats.some((f) => f.depthDataFormats.length > 0)
  }, [device])

  const outputs = useMemo(() => {
    const result: CameraOutput[] = [photoOutput, frameOutput]
    if (supportsDepth) {
      result.push(depthOutput)
    }
    return result
  }, [depthOutput, photoOutput, supportsDepth, frameOutput])

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
          <NativeFrameRendererView
            style={styles.camera}
            hybridRef={callback((ref) => {
              console.log(`Ref initialized! ${ref}`)
              const boxed = NitroModules.box(ref)
              setRendererBoxed(boxed)
            })}
          />
          {device != null && (
            <Camera
              style={styles.camera}
              input={device}
              outputs={outputs}
            />
          )}
        </View>
      </GestureDetector>
      <Button
        disabled={nextDeviceIndex === deviceIndex}
        title={`Switch to Device #${nextDeviceIndex}`}
        onPress={() => setDeviceIndex(nextDeviceIndex)} />
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
