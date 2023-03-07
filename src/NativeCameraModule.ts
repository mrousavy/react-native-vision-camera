import { NativeModules, Platform } from 'react-native';

// NativeModules automatically resolves 'CameraView' to 'CameraViewModule'
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const CameraModule = NativeModules.CameraView;
if (CameraModule == null) {
  let message =
    'Failed to initialize VisionCamera: The native Camera Module (`NativeModules.CameraView`) could not be found.';
  message +=
    '\n* Make sure react-native-vision-camera is correctly autolinked (run `npx react-native config` to verify)';
  if (Platform.OS === 'ios' || Platform.OS === 'macos') {
    message += '\n* Make sure you ran `pod install` in the ios/ directory.';
  }
  if (Platform.OS === 'android') {
    message += '\n* Make sure gradle is synced.';
  }
  // check if Expo
  const ExpoConstants =
    NativeModules.NativeUnimoduleProxy?.modulesConstants?.ExponentConstants;
  if (ExpoConstants != null) {
    if (ExpoConstants.appOwnership === 'expo') {
      // We're running Expo Go
      throw new Error(
        'react-native-vision-camera is not supported in Expo Go! Use EAS (`expo prebuild`) or eject to a bare workflow instead.'
      );
    } else {
      // We're running Expo bare / standalone
      message += '\n* Make sure you ran `expo prebuild`.';
    }
  }

  message += '\n* Make sure you rebuilt the app.';
  throw new Error(message);
}
