import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory } from 'react-native-vision-camera'
import { CameraDevice } from 'react-native-vision-camera/lib/specs/CameraDevice.nitro';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function useDevices(): CameraDevice[] {
  const [devices, setDevices] = useState<CameraDevice[]>([])

  useEffect(() => {
    let listener: ({ remove: () => void }) | undefined
    (async () => {
      const factory = await HybridCameraFactory.createDeviceFactory()
      setDevices(factory.cameraDevices)
      factory.addOnCameraDevicesChangedListener((d) => setDevices(d))
    })()
    return () => {
      listener?.remove()
    }
  }, [])

  return devices
}

function AppContent() {
  const devices = useDevices()

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
