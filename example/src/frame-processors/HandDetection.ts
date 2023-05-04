import type { Frame } from 'react-native-vision-camera';

interface Landmark {
  x: number;
  y: number;
}

interface HandLandmarks {
  wrist: Landmark;
  thumb_cmc: Landmark;
  thumb_mcp: Landmark;
  thumb_ip: Landmark;
  thumb_tip: Landmark;
  index_finger_mcp: Landmark;
  index_finger_pip: Landmark;
  index_finger_dip: Landmark;
  index_finger_tip: Landmark;
  middle_finger_mcp: Landmark;
  middle_finger_pip: Landmark;
  middle_finger_dip: Landmark;
  middle_finger_tip: Landmark;
  ring_finger_mcp: Landmark;
  ring_finger_pip: Landmark;
  ring_finger_dip: Landmark;
  ring_finger_tip: Landmark;
  pinky_mcp: Landmark;
  pinky_pip: Landmark;
  pinky_dip: Landmark;
  pinky_tip: Landmark;
}

export function detectHands(frame: Frame): { hands: HandLandmarks[] } {
  'worklet';
  // @ts-expect-error because this function is dynamically injected by VisionCamera
  return FrameProcessorPlugins.detectHands(frame);
}
