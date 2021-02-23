import { useMemo } from 'react';
import type { CameraDevice, CameraDeviceFormat } from '../CameraDevice';
import { filterFormatsByAspectRatio, sortFormatsByResolution } from '../utils/FormatFilter';
import type { Size } from '../utils/FormatFilter';

/**
 * Returns the best format for the given camera device.
 *
 * This function tries to choose a format with the highest possible photo-capture resolution and best matching aspect ratio.
 *
 * @param device The Camera Device
 * @param cameraViewSize The Camera View's size. This can be an approximation and **must be memoized**! Default: `SCREEN_SIZE`
 *
 * @returns The best matching format for the given camera device, or `undefined` if the camera device is `undefined`.
 */
export function useCameraFormat(device?: CameraDevice, cameraViewSize?: Size): CameraDeviceFormat | undefined {
  const formats = useMemo(() => {
    if (device?.formats == null) return [];
    const filtered = filterFormatsByAspectRatio(device.formats, cameraViewSize);
    return filtered.sort(sortFormatsByResolution);
  }, [device?.formats, cameraViewSize]);

  return formats[0];
}
