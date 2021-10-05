import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Splash } from './Splash';
import { MediaPage } from './MediaPage';
import { CameraPage } from './CameraPage';

const Stack = createNativeStackNavigator();

export function App(): React.ReactElement {
  return (
    <NavigationContainer>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="MediaPage" component={MediaPage} />
      <Stack.Screen name="CameraPage" component={CameraPage} />
    </NavigationContainer>
  );
}
