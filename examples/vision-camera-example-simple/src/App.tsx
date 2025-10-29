import { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory, useCameraDevices } from 'react-native-vision-camera'

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

  useEffect(() => {
    const device = devices[0]
    if (device == null) return

    (async () => {
      try {
      const mark1 = performance.now()
      const session = HybridCameraFactory.createCameraSession()
      const photo = HybridCameraFactory.createPhotoOutput()
      await session.configure([device], [photo])
      const mark2 = performance.now()
      console.log(`Configure took ${(mark2 - mark1).toFixed(0)}ms!`)

      await timeout(5000)

      const image = await photo.capturePhoto({
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
      const mark3 = performance.now()
      console.log(`Photo capture took ${(mark3 - mark2).toFixed(0)}ms!`)
      console.log(image.width, image.height)
      console.log(image.toRawPixelData().buffer.byteLength)
    } catch(e) {
      console.error(e)
    }
    })()
  }, [devices])

  return (
    <View style={styles.container}>
      {devices.map((d) => (
        <Text key={d.id}>{d.id}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
