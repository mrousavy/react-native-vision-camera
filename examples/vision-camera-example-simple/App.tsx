import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { HybridCameraFactory } from 'react-native-vision-camera'

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
  return (
    <View style={styles.container}>
      <Text>{HybridCameraFactory.cameraDevices.map((d) => d.deviceName).join(', ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
