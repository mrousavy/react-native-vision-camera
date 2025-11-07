import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image, Images, NitroImage } from 'react-native-nitro-image';
import { NitroModules } from 'react-native-nitro-modules';
import { BoxedHybridObject } from 'react-native-nitro-modules/lib/typescript/BoxedHybridObject';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory, HybridWorkletQueueFactory, NativePreviewView, useCameraDevices } from 'react-native-vision-camera'
import { createWorkletRuntime, scheduleOnRN, scheduleOnRuntime } from 'react-native-worklets';

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
const box = globalThis.__box__ as typeof NitroModules["box"]

const loadFromRaw = globalThis.__loadFromRaw__ as typeof Images["loadFromRawPixelData"]

function AppContent() {
  const devices = useCameraDevices()
  const session = useMemo(() => HybridCameraFactory.createCameraSession(), [])
  const [image, setImage] = useState<BoxedHybridObject<Image>>()

  const updateI = (i: BoxedHybridObject<Image>) => {
    setImage(i)
  }

  useEffect(() => {
    for (const device of devices) {
      console.log(`${device.id} ${device.formats[0].mediaType} ${device.formats[0]!.supportedColorSpaces[0]} ${device.formats[0].photoResolution.width} x ${device.formats[0].photoResolution.height} ("${device.localizedName}")`)
    }
  }, [devices])

  const createVideoOutput = useCallback(() => {
    const output = HybridCameraFactory.createDepthOutput()
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

        const mainBuf = frame.getPixelBuffer()
        console.log(`MAIN: ${frame.width}x${frame.height} = ${mainBuf.byteLength}`)
        for (const plane of frame.getPlanes()) {
          const buf = plane.getPixelBuffer()

          console.log(`- PLANE: ${plane.width}x${plane.height} = ${buf.byteLength}`)
        }
        try {
          if (frame.isPlanar) {
            const yPlane = frame.getPlanes()[0]
            console.log(`Y: ${yPlane.width}x${yPlane.height}`)
            const buffer = yPlane.getPixelBuffer()
            const rgbBuffer = new ArrayBuffer(buffer.byteLength * 4)
            console.log(`New Buf: ${buffer.byteLength} -> ${rgbBuffer.byteLength}`)
            const fromView = new Uint8Array(buffer)
            const toView = new Uint32Array(rgbBuffer)
            for (let i = 0; i < buffer.byteLength; i++) {
              toView[i] = fromView[i]
            }
            console.log(`Copied!`)

            const i = loadFromRaw({
              width: yPlane.width,
              height: yPlane.height,
              pixelFormat: 'ARGB',
              buffer: rgbBuffer
            }, false)
            console.log(`Loaded: ${i.width}x${i.height}!`)
            scheduleOnRN(updateI, box(i))
          } else {
            const i = frame.toImage()
            scheduleOnRN(updateI, box(i))
          }
        } catch (e) {
          console.error(e)
        }

        const view = new Uint8Array(mainBuf)
        console.log(`[0,0] BEFORE: ${view[0]}, ${view[1]}, ${view[2]}, ${view[3]}`)
        frame.dispose()
        console.log(`[0,0] AFTER:  ${view[0]}, ${view[1]}, ${view[2]}, ${view[3]}`)

        return true
      })
    })
    return output
  }, [])

  useEffect(() => {
    const device = devices.find((d) => d.localizedName.includes('LiDAR'))
    if (device == null) {
      return
    }

    (async () => {
      try {
        const mark1 = performance.now()
        const photo = HybridCameraFactory.createPhotoOutput()
        const video = createVideoOutput()
        await session.configure([device], [photo, video], {})
        const mark2 = performance.now()
        console.log(`Configure took ${(mark2 - mark1).toFixed(0)}ms!`)

        await session.start()
        const mark3 = performance.now()
        console.log(`Start took ${(mark3 - mark2).toFixed(0)}ms!`)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [createVideoOutput, devices, session])

  return (
    <View style={styles.container}>
      {devices.map((d) => (
        <Text key={d.id}>{d.id}</Text>
      ))}
      <NativePreviewView style={styles.camera} session={session} />
      <View style={styles.camera}>
        {image && (
          <NitroImage image={image.unbox()} style={styles.photo} />
        )}
      </View>
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
    flex: 1,
    alignItems: 'center'
  },
  photo: {
    flex: 1,
    aspectRatio: 9 / 16
  }
});

export default App;
