import { useMemo } from 'react';
import type { CameraDevice, CameraDeviceFormat } from '../CameraDevice';
import { sortFormats } from '../utils/FormatFilter';

/**
 * Returns the best format for the given camera device.
 *
 * This function tries to choose a format with the highest possible photo-capture resolution and best matching aspect ratio.
 *
 * @param {CameraDevice} device The Camera Device
 *
 * @returns The best matching format for the given camera device, or `undefined` if the camera device is `undefined`.
 */
export function useCameraFormat(device?: CameraDevice): CameraDeviceFormat | undefined {
  return useMemo(() => device?.formats.sort(sortFormats)[0], [device?.formats]);
}
