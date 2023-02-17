import { FrameProcessorPlugins, Frame } from 'react-native-vision-camera';

/**
 * Represents a Face's bounding box on the screen.
 *
 * Values are from 0 to 1.
 */
export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function detectFaces(frame: Frame): FaceBoundingBox[] {
  'worklet';
  // @ts-expect-error because this function is dynamically injected by VisionCamera
  return FrameProcessorPlugins.detectFaces(frame);
}
