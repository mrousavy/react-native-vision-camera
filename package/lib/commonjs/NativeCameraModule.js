"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CameraModule = void 0;
var _reactNative = require("react-native");
var _CameraError = require("./CameraError");
const supportedPlatforms = ['ios', 'android', 'macos'];

// NativeModules automatically resolves 'CameraView' to 'CameraViewModule'
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const CameraModule = exports.CameraModule = _reactNative.NativeModules.CameraView;
if (CameraModule == null) {
  if (!supportedPlatforms.includes(_reactNative.Platform.OS)) {
    throw new _CameraError.CameraRuntimeError('system/camera-module-not-found', `Failed to initialize VisionCamera: VisionCamera currently does not work on ${_reactNative.Platform.OS}.`);
  }
  let message = 'Failed to initialize VisionCamera: The native Camera Module (`NativeModules.CameraView`) could not be found.';
  message += '\n* Make sure react-native-vision-camera is correctly autolinked (run `npx react-native config` to verify)';
  if (_reactNative.Platform.OS === 'ios' || _reactNative.Platform.OS === 'macos') message += '\n* Make sure you ran `pod install` in the ios/ directory.';
  if (_reactNative.Platform.OS === 'android') message += '\n* Make sure gradle is synced.';

  // check if Expo
  // @ts-expect-error expo global JSI modules are not typed
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const ExpoConstants = global.expo?.modules?.ExponentConstants;
  if (ExpoConstants != null) {
    if (ExpoConstants.appOwnership === 'expo') {
      // We're running Expo Go
      throw new _CameraError.CameraRuntimeError('system/camera-module-not-found', `react-native-vision-camera is not supported in Expo Go! Use EAS/expo prebuild instead (\`expo run:${_reactNative.Platform.OS}\`). For more info, see https://docs.expo.dev/workflow/prebuild/.`);
    } else {
      // We're running Expo bare / standalone
      message += '\n* Make sure you ran `expo prebuild`.';
    }
  }
  message += '\n* Make sure you rebuilt the app.';
  throw new _CameraError.CameraRuntimeError('system/camera-module-not-found', message);
}
//# sourceMappingURL=NativeCameraModule.js.map