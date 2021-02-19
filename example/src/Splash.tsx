import React, { useEffect, useState } from 'react';

import { StyleSheet, View, Text, Image  } from 'react-native';
import { Camera, CameraPermissionStatus } from 'react-native-vision-camera';
import { SAFE_AREA_PADDING } from './Constants';

export default function Splash() {
  const [
    cameraPermissionStatus,
    setCameraPermissionStatus,
  ] = useState<CameraPermissionStatus>("not-determined");
  const [
    microphonePermissionStatus,
    setMicrophonePermissionStatus,
  ] = useState<CameraPermissionStatus>("not-determined");

  useEffect(() => {
    const checkPermissions = async () => {
      console.log(`Checking Permission status...`);
      let [cameraPermission, microphonePermission] = await Promise.all([
        Camera.getCameraPermissionStatus(),
        Camera.getMicrophonePermissionStatus(),
      ]);
      console.log(
        `Check: CameraPermission: ${cameraPermission} | MicrophonePermission: ${microphonePermission}`
      );
      if (cameraPermission !== "authorized")
        cameraPermission = await Camera.requestCameraPermission();
      if (microphonePermission !== "authorized")
        microphonePermission = await Camera.requestMicrophonePermission();
        console.log(
        `Request: CameraPermission: ${cameraPermission} | MicrophonePermission: ${microphonePermission}`
      );
      setCameraPermissionStatus(cameraPermission);
      setMicrophonePermissionStatus(microphonePermission);
    };

    checkPermissions();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../../img/11.png')} style={styles.banner} />
      <Text style={styles.welcome}>Welcome to{'\n'}Vision Camera.</Text>


      <Text>Camera Permission: {cameraPermissionStatus}</Text>
      <Text>Camera Permission: {microphonePermissionStatus}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: {
    fontSize: 38,
    fontWeight: 'bold',
    maxWidth: '80%',
  },
  banner: {
    position: 'absolute',
    opacity: 0.4,
    bottom: 0,
    left: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    ...SAFE_AREA_PADDING
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
