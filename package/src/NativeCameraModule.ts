import { NativeModules, Platform } from 'react-native'
import { CameraRuntimeError } from './CameraError'

const supportedPlatforms = ['ios', 'android', 'macos']

// NativeModules automatically resolves 'CameraView' to 'CameraViewModule'
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const CameraModule = NativeModules.CameraView
if (CameraModule == null) {
  if (!supportedPlatforms.includes(Platform.OS)) {
    throw new CameraRuntimeError(
      'system/camera-module-not-found',
      `Failed to initialize VisionCamera: VisionCamera currently does not work on ${Platform.OS}.`,
    )
  }

  let message = 'Failed to initialize VisionCamera: The native Camera Module (`NativeModules.CameraView`) could not be found.'
  message += '\n* Make sure react-native-vision-camera is correctly autolinked (run `npx react-native config` to verify)'
  if (Platform.OS === 'ios' || Platform.OS === 'macos') message += '\n* Make sure you ran `pod install` in the ios/ directory.'

  if (Platform.OS === 'android') message += '\n* Make sure gradle is synced.'

  // check if Expo
  // @ts-expect-error expo global JSI modules are not typed
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const ExpoConstants = global.expo?.modules?.ExponentConstants
  if (ExpoConstants != null) {
    if (ExpoConstants.appOwnership === 'expo') {
      // We're running Expo Go
      throw new CameraRuntimeError(
        'system/camera-module-not-found',
        `react-native-vision-camera is not supported in Expo Go! Use EAS/expo prebuild instead (\`expo run:${Platform.OS}\`). For more info, see https://docs.expo.dev/workflow/prebuild/.`,
      )
    } else {
      // We're running Expo bare / standalone
      message += '\n* Make sure you ran `expo prebuild`.'
    }
  }

  message += '\n* Make sure you rebuilt the app.'
  throw new CameraRuntimeError('system/camera-module-not-found', message)
}
