/* global __example_plugin __example_plugin_swift __example_plugin_filter */
import type { Frame } from 'react-native-vision-camera';

declare let _WORKLET: true | undefined;

export function examplePluginFilter(frame: Frame, intensity: number): Frame {
  'worklet';
  if (!_WORKLET) throw new Error('examplePluginFilter must be called from a frame processor!');

  // @ts-expect-error because this function is dynamically injected by VisionCamera
  return __example_plugin_filter(frame, intensity);
}

export function examplePluginSwift(frame: Frame): Frame {
  'worklet';
  if (!_WORKLET) throw new Error('examplePluginSwift must be called from a frame processor!');

  // @ts-expect-error because this function is dynamically injected by VisionCamera
  return __example_plugin_swift(frame, 'hello!', 'parameter2', true, 42, { test: 0, second: 'test' }, ['another test', 5]);
}

export function examplePlugin(frame: Frame): string[] {
  'worklet';
  if (!_WORKLET) throw new Error('examplePlugin must be called from a frame processor!');

  // @ts-expect-error because this function is dynamically injected by VisionCamera
  return __example_plugin(frame, 'hello!', 'parameter2', true, 42, { test: 0, second: 'test' }, ['another test', 5]);
}
