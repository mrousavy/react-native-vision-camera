import React, { useEffect, useState } from 'react';

import { StyleSheet, View, Text  } from 'react-native';
import { Camera, CameraPermissionStatus } from 'react-native-vision-camera';

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
      <Text>Camera Permission: {cameraPermissionStatus}</Text>
      <Text>Microphone Permission: {microphonePermissionStatus}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
