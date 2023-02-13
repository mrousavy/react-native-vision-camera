import { FrameProcessorPlugins, Frame } from 'react-native-vision-camera';

export function examplePluginSwift(frame: Frame): string[] {
  'worklet';
  // @ts-expect-error because this function is dynamically injected by VisionCamera
  return FrameProcessorPlugins.example_plugin_swift(frame, 'hello!', 'parameter2', true, 42, { test: 0, second: 'test' }, [
    'another test',
    5,
  ]);
}

export function examplePlugin(frame: Frame): string[] {
  'worklet';
  // @ts-expect-error because this function is dynamically injected by VisionCamera
  return FrameProcessorPlugins.example_plugin(frame, 'hello!', 'parameter2', true, 42, { test: 0, second: 'test' }, ['another test', 5]);
}
