import type { DependencyList } from 'react';
import type { Frame } from 'src/FrameProcessor';

let reanimatedModule: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useWorkletCallback: (fn: (...args: any[]) => void, deps: DependencyList) => typeof fn;
};

export function useFrameProcessor(
  frameProcessor: (frame: Frame) => void,
  dependencies: DependencyList,
): ReturnType<typeof reanimatedModule['useWorkletCallback']> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  if (reanimatedModule == null) reanimatedModule = require('react-native-reanimated');

  return reanimatedModule.useWorkletCallback(frameProcessor, dependencies);
}
