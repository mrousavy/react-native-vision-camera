/* global _WORKLET __exampleObjC___scanQRCodes __exampleSwift___scanQRCodes */
import type { Frame } from 'react-native-vision-camera';

export function scanQRCodesSwift(frame: Frame): string[] {
  'worklet';
  if (!_WORKLET) throw new Error('scanQRCodesSwift must be called from a frame processor!');

  // @ts-expect-error because this function is dynamically injected by VisionCamera
  return __exampleSwift___scanQRCodes(frame);
}

export function scanQRCodesObjC(frame: Frame): string[] {
  'worklet';
  if (!_WORKLET) throw new Error('scanQRCodesObjC must be called from a frame processor!');

  // @ts-expect-error because this function is dynamically injected by VisionCamera
  return __exampleObjC___scanQRCodes(frame, 'hello!', 'parameter2', true, 42);
}
