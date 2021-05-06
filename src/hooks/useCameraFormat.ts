import { useMemo } from 'react';
import type { CameraDevice, CameraDeviceFormat } from '../CameraDevice';
import { filterFormatsByAspectRatio, sortFormatsByResolution } from '../utils/FormatFilter';
import type { Size } from '../utils/FormatFilter';

/**
 * Returns the best format for the given camera device.
 *
 * This function tries to choose a format with the highest possible photo-capture resolution and best matching aspect ratio.
 *
 * @param {CameraDevice} device The Camera Device
 * @param {Size} cameraViewSize The Camera View's size. This can be an approximation and **must be memoized**! Default: `SCREEN_SIZE`
 *
 * @returns The best matching format for the given camera device, or `undefined` if the camera device is `undefined`.
 */
export function useCameraFormat(device?: CameraDevice, cameraViewSize?: Size): CameraDeviceFormat | undefined {
  const formats = useMemo(() => {
    if (device?.formats == null) return [];
    const filtered = filterFormatsByAspectRatio(device.formats, cameraViewSize);

    const sorted = filtered.sort(sortFormatsByResolution);
    const bestFormat = sorted[0];
    if (bestFormat == null) return [];
    const bestFormatResolution = bestFormat.photoHeight * bestFormat.photoWidth;

    return sorted.filter((f) => {
      // difference in resolution in percent (e.g. 100x100 is 0.5 of 200x200)
      const resolutionDiff = (bestFormatResolution - f.photoHeight * f.photoWidth) / bestFormatResolution;
      // formats that are less than 25% of the bestFormat's resolution are dropped. They are too much quality loss
      return resolutionDiff <= 0.25;
    });
  }, [device?.formats, cameraViewSize]);

  return formats[0];
}
