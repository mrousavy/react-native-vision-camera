/* global _WORKLET __scanQRCodes */
import type { Frame } from 'src/Frame';

/**
 * Scans the given Frame for QR codes
 * @param frame The camera frame
 * @returns An array of detected QR codes, or `[]` if none.
 */
export function scanQRCodes(frame: Frame): string[] {
  'worklet';
  if (!_WORKLET) throw new Error('scanQRCodes(...) has to be called inside of a Frame Processor!');

  // @ts-expect-error
  return __scanQRCodes(frame);
}
