import type { Frame } from 'react-native-vision-camera';

interface Face {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

export function detectFaces(frame: Frame): { faces: Face[] } {
  'worklet';
  // @ts-expect-error because this function is dynamically injected by VisionCamera
  return FrameProcessorPlugins.detectFaces(frame);
}
