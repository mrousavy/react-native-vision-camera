import { CameraRuntimeError } from './CameraError';

export function assertJSIAvailable(): void {
  // Check if we are running on-device (JSI)
  // @ts-expect-error JSI functions aren't typed
  if (global.nativeCallSyncHook == null) {
    throw new CameraRuntimeError(
      'frame-processor/unavailable',
      'Failed to initialize VisionCamera Frame Processors: React Native is not running on-device. Frame Processors can only be used when synchronous method invocations (JSI) are possible. If you are using a remote debugger (e.g. Chrome), switch to an on-device debugger (e.g. Flipper) instead.',
    );
  }
}

export function assertFrameProcessorsAvailable(): void {
  // @ts-expect-error JSI functions aren't typed
  if (global.setFrameProcessor == null || global.unsetFrameProcessor == null) {
    throw new CameraRuntimeError(
      'frame-processor/unavailable',
      'Frame Processors are not enabled. See https://mrousavy.github.io/react-native-vision-camera/docs/guides/troubleshooting',
    );
  }
}
