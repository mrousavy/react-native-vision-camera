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

function AppContent() {
  const devices = useCameraDevices()

  useEffect(() => {
    const device = devices[0]
    if (device == null) return

    (async () => {
      const mark1 = globalThis.performance.now()
      const session = HybridCameraFactory.createCameraSession()
      const photo = HybridCameraFactory.createPhotoOutput()
      await session.configure([device], [photo])
      const mark2 = globalThis.performance.now()
      console.log(`Configure took ${(mark2 - mark1).toFixed(0)}ms!`)

      await photo.capturePhoto()
      const mark3 = globalThis.performance.now()
      console.log(`Photo capture took ${(mark3 - mark2).toFixed(0)}ms!`)
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
