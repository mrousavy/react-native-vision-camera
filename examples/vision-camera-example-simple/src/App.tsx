import { useEffect, useMemo, useState, } from 'react';
import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image, Images, NitroImage } from 'react-native-nitro-image';
import { AsyncImageSource } from 'react-native-nitro-image/lib/typescript/AsyncImageSource';
import { NitroModules } from 'react-native-nitro-modules';
import { BoxedHybridObject } from 'react-native-nitro-modules/lib/typescript/BoxedHybridObject';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
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

function timeout(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}

function AppContent() {
  const devices = useCameraDevices()
  const session = useMemo(() => HybridCameraFactory.createCameraSession(), [])
  const [i, setI] = useState<BoxedHybridObject<Image> | undefined>(undefined)

  const updateI = (i: BoxedHybridObject<Image>) => {
    setI(i)
  }

  useEffect(() => {
    for (const device of devices) {
      console.log(`${device.id} ${device.formats[0].mediaType} ${device.formats[0]!.supportedColorSpaces[0]} ${device.formats[0].photoResolution.width} x ${device.formats[0].photoResolution.height} ("${device.localizedName}")`)
    }
  }, [devices])

  NitroModules.isHybridObject({})
  const boxFn = globalThis.__box__ as Function

  const createVideoOutput = () => {
    const output = HybridCameraFactory.createFrameOutput('rgb-bgra-32-bit')
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
        const image = frame.toImage()
        console.log(`Created ${image.width}x${image.height} Image!`)
        const boxed = boxFn(image)
        scheduleOnRN(updateI, boxed)
        frame.dispose()
        return true
      })
    })
    return output
  }

  useEffect(() => {
    const device = devices[0]
    if (device == null) return

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
  }, [devices, session])

  return (
    <View style={styles.container}>
      {devices.map((d) => (
        <Text key={d.id}>{d.id}</Text>
      ))}
      <NativePreviewView style={styles.camera} session={session} />
      {i != null && (<NitroImage style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }} image={i.unbox()} />)}
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
