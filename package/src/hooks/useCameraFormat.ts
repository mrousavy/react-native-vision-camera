import { useMemo } from 'react';
import { CameraDevice, CameraDeviceFormat } from '../CameraDevice';
import { FormatFilter, getCameraFormat } from '../devices/getCameraFormat';

/**
 * Get the best matching Camera format for the given device that satisfies your requirements using a sorting filter. By default, formats are sorted by highest to lowest resolution.
 * @param device The Camera Device you're currently using
 * @param filter The filter you want to use. The format that matches your filter the closest will be returned
 * @returns The format that matches your filter the closest.
 * @example
 * ```ts
 * const device = useCameraDevice(...)
 * const format = useCameraFormat(device, {
 *   videoResolution: { target: { width: 3048, height: 2160 }, priority: 2 },
 *   fps: { target: 60, priority: 1 }
 * })
 * ```
 */
export function useCameraFormat(device: CameraDevice | undefined, filter: FormatFilter): CameraDeviceFormat | undefined {
  const format = useMemo(() => {
    if (device == null) return undefined;
    return getCameraFormat(device, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, JSON.stringify(filter)]);

  return format;
}
