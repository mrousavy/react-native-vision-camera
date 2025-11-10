import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image, Images, NitroImage } from 'react-native-nitro-image';
import { NitroModules } from 'react-native-nitro-modules';
import { BoxedHybridObject } from 'react-native-nitro-modules/lib/typescript/BoxedHybridObject';
import { clamp, useSharedValue } from 'react-native-reanimated';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory, useCameraDevices, CameraOutput, Camera, useFrameOutput, Frame, Depth, useDepthOutput } from 'react-native-vision-camera'
import { scheduleOnRN } from 'react-native-worklets';

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

NitroModules.isHybridObject({})
const globalBox = globalThis.__box__ as typeof NitroModules["box"]

const imageFactoryBoxed = NitroModules.box(Images)

function AppContent() {
  const devices = useCameraDevices()
  const [deviceIndex, setDeviceIndex] = useState(0)
  let nextDeviceIndex = deviceIndex + 1
  if (nextDeviceIndex >= devices.length) {
    nextDeviceIndex = 0
  }
  const [image, setImage] = useState<Image>()
  const updateImage = useCallback((boxed: BoxedHybridObject<Image>) => {
    setImage((curr) => {
      return boxed.unbox()
    })
  }, [])

  const device = devices.find((d) => d.localizedName.includes('LiDAR')) ?? devices[deviceIndex]
  const [zoom, setZoom] = useState(1)

  const supportsDepth = useMemo(() => {
    if (device == null) return false
    return device.formats.some((f) => f.depthDataFormats.length > 0)
  }, [device])

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
  }, [])
  const onDepth = useCallback((depth: Depth) => {
    'worklet'
    console.log(`Running on ${depth.width}x${depth.height} ${depth.pixelFormat} Depth!`)

    const sourceBuffer = depth.getDepthData()
    const stride = 4
    const rgbBuffer = new ArrayBuffer(sourceBuffer.byteLength * stride)
    console.log(`New Buf: ${sourceBuffer.byteLength} -> ${rgbBuffer.byteLength}`)
    if (depth.pixelFormat === "depth-32-bit") {
      const fromView = new Float32Array(sourceBuffer)
      const toView = new Uint8ClampedArray(rgbBuffer)
      for (let i = 0; i < toView.length; i += stride) {
        const d = fromView[i / stride] ?? 0
        toView[i + 0] = d * 255
        toView[i + 1] = d * 255
        toView[i + 2] = d * 255
        toView[i + 3] = 255
      }
    } else {
      const fromView = new Uint8Array(sourceBuffer)
      const toView = new Uint8Array(rgbBuffer)
      for (let i = 0; i < fromView.length; i++) {
        toView[i + 0] = fromView[i]!
        toView[i + 1] = fromView[i]!
        toView[i + 2] = fromView[i]!
        toView[i + 3] = fromView[i]!
      }
    }

    const images = imageFactoryBoxed.unbox()
    const i = images.loadFromRawPixelData({
      width: depth.width,
      height: depth.height,
      pixelFormat: 'BGRA',
      buffer: rgbBuffer
    }, false)
    const boxed = globalBox(i)
    scheduleOnRN(updateImage, boxed)

    depth.dispose()
  }, [updateImage])

  const frameOutput = useFrameOutput({
    onFrame: onFrame
  })
  const depthOutput = useDepthOutput({
    onDepth: onDepth
  })
  const photoOutput = useMemo(() => HybridCameraFactory.createPhotoOutput(), [])

  const outputs = useMemo(() => {
    console.log('rebuilding outputs')
    const result: CameraOutput[] = [photoOutput]
    if (supportsDepth) {
      result.push(depthOutput)
    }
    return result
  }, [depthOutput, photoOutput, supportsDepth])

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

  const format = useMemo(() => device?.formats.find((f) => f.depthDataFormats.length > 0), [device])
  const depthFormat = useMemo(() => format?.depthDataFormats.find((f) => f.nativePixelFormat === 'depth-32-bit'), [format])

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
                activeFormat: format,
                activeDepthFormat: depthFormat,
              }}
            />
          )}
          {image != null && (
            <NitroImage resizeMode='contain' style={styles.camera} image={image} />
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
