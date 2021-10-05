import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Splash } from './Splash';
import { MediaPage } from './MediaPage';
import { CameraPage } from './CameraPage';
import type { Routes } from './Routes';
import { Camera, CameraPermissionStatus } from 'react-native-vision-camera';

const Stack = createNativeStackNavigator<Routes>();

export function App(): React.ReactElement | null {
  const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>();
  const [microphonePermission, setMicrophonePermission] = useState<CameraPermissionStatus>();

  useEffect(() => {
    Camera.getCameraPermissionStatus().then(setCameraPermission);
    Camera.getMicrophonePermissionStatus().then(setMicrophonePermission);
  }, []);

  console.log(`Re-rendering Navigator. Camera: ${cameraPermission} | Microphone: ${microphonePermission}`);

  if (cameraPermission == null || microphonePermission == null) {
    // still loading
    return null;
  }

  const showSplash = cameraPermission !== 'authorized' || microphonePermission === 'not-determined';
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          statusBarStyle: 'dark',
          animationTypeForReplace: 'push',
        }}
        initialRouteName={showSplash ? 'Splash' : 'CameraPage'}>
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="CameraPage" component={CameraPage} />
        <Stack.Screen
          name="MediaPage"
          component={MediaPage}
          options={{
            animation: 'none',
            presentation: 'transparentModal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
