import { useEffect, useMemo,  } from 'react';
import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory, NativePreviewView, useCameraDevices } from 'react-native-vision-camera'

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
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

  useEffect(() => {
    const device = devices[0]
    if (device == null) return

    (async () => {
      try {
      const mark1 = performance.now()
      const photo = HybridCameraFactory.createPhotoOutput()
      await session.configure([device], [photo])
      const mark2 = performance.now()
      console.log(`Configure took ${(mark2 - mark1).toFixed(0)}ms!`)

      await session.start()
      const mark3 = performance.now()
      console.log(`Start took ${(mark3 - mark2).toFixed(0)}ms!`)

      await timeout(5000)
      const mark4 = performance.now()

      const image = await photo.capturePhoto({
      },
      {
        onDidCapturePhoto() {
          console.log('onDidCapturePhoto')
        },
        onDidFinishCapture() {
          console.log('onDidFinishCapture')
        },
        onWillBeginCapture() {
          console.log('onWillBeginCapture')
        },
        onWillCapturePhoto() {
          console.log('onWillCapturePhoto')
        }
      })
      const mark5 = performance.now()
      console.log(`Photo capture took ${(mark5 - mark4).toFixed(0)}ms!`)
      const converted = image.toImage()
      const mark6 = performance.now()
      console.log(`Captured ${converted.width}x${converted.height} image, conversion took ${(mark6 - mark5).toFixed(0)}ms!`)
      console.log(image.metadata)
    } catch(e) {
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
