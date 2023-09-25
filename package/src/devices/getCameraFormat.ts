import type { CameraDevice, CameraDeviceFormat, VideoStabilizationMode } from '../CameraDevice';
import { CameraRuntimeError } from '../CameraError';
import { PixelFormat } from '../PixelFormat';

interface Size {
  width: number;
  height: number;
}

export interface FormatFilter {
  /**
   * The target resolution of the video (and frame processor) output pipeline.
   * If no format supports the given resolution, the format closest to this value will be used.
   */
  videoResolution?: Size | 'max';
  /**
   * The target resolution of the photo output pipeline.
   * If no format supports the given resolution, the format closest to this value will be used.
   */
  photoResolution?: Size | 'max';
  /**
   * The target aspect ratio of the video (and preview) output, expressed as a factor: `width / height`.
   * (Note: Cameras are in landscape orientation)
   *
   * In most cases, you want this to be as close to the screen's aspect ratio as possible (usually ~9:16).
   *
   * @example
   * ```ts
   * const screen = Dimensions.get('screen')
   * targetVideoAspectRatio: screen.height / screen.width
   * ```
   */
  videoAspectRatio?: number;
  /**
   * The target aspect ratio of the photo output, expressed as a factor: `width / height`.
   * (Note: Cameras are in landscape orientation)
   *
   * In most cases, you want this to be the same as `targetVideoAspectRatio`, which you often want
   * to be as close to the screen's aspect ratio as possible (usually ~9:16)
   *
   * @example
   * ```ts
   * const screen = Dimensions.get('screen')
   * targetPhotoAspectRatio: screen.height / screen.width
   * ```
   */
  photoAspectRatio?: number;
  /**
   * The target FPS you want to record video at.
   * If the FPS requirements can not be met, the format closest to this value will be used.
   */
  fps?: number;
  /**
   * The target video stabilization mode you want to use.
   * If no format supports the target video stabilization mode, the best other matching format will be used.
   */
  videoStabilizationMode?: VideoStabilizationMode;
  /**
   * The target pixel format you want to use.
   * If no format supports the target pixel format, the best other matching format will be used.
   */
  pixelFormat?: PixelFormat;
  /**
   * Whether you want to find a format that supports Photo HDR.
   */
  photoHDR?: boolean;
  /**
   * Whether you want to find a format that supports Photo HDR.
   */
  videoHDR?: boolean;
}

type FilterWithPriority<T> = {
  target: Exclude<T, null | undefined>;
  priority: number;
};
type FilterMap = {
  [K in keyof FormatFilter]: FilterWithPriority<FormatFilter[K]>;
};
function filtersToFilterMap(filters: FormatFilter[]): FilterMap {
  return filters.reduce<FilterMap>((map, curr, index) => {
    for (const key in curr) {
      // @ts-expect-error keys are untyped
      map[key] = {
        // @ts-expect-error keys are untyped
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        target: curr[key],
        priority: filters.length - index,
      };
    }
    return map;
  }, {});
}

/**
 * Get the best matching Camera format for the given device that satisfies your requirements using a sorting filter. By default, formats are sorted by highest to lowest resolution.
 *
 * The {@linkcode filters | filters} are ranked by priority, from highest to lowest.
 * This means the first item you pass will have a higher priority than the second, and so on.
 *
 * @param device The Camera Device you're currently using
 * @param filter The filter you want to use. The format that matches your filter the closest will be returned
 * @returns The format that matches your filter the closest.
 *
 * @example
 * ```ts
 * const format = getCameraFormat(device, [
 *   { videoResolution: { width: 3048, height: 2160 } },
 *   { fps: 60 }
 * ])
 * ```
 */
export function getCameraFormat(device: CameraDevice, filters: FormatFilter[]): CameraDeviceFormat {
  // Combine filters into a single filter map for constant-time lookup
  const filter = filtersToFilterMap(filters);

  let bestFormat = device.formats[0];
  if (bestFormat == null)
    throw new CameraRuntimeError('device/invalid-device', `The given Camera Device (${device.id}) does not have any formats!`);

  // Compare each format using a point scoring system
  for (const format of device.formats) {
    let leftPoints = 0;
    let rightPoints = 0;

    const leftVideoResolution = bestFormat.videoWidth * bestFormat.videoHeight;
    const rightVideoResolution = format.videoWidth * format.videoHeight;
    if (filter.videoResolution != null) {
      if (filter.videoResolution.target === 'max') {
        // We just want the maximum resolution
        if (leftVideoResolution > rightVideoResolution) leftPoints += filter.videoResolution.priority;
        if (rightVideoResolution > leftVideoResolution) rightPoints += filter.videoResolution.priority;
      } else {
        // Find video resolution closest to the filter (ignoring orientation)
        const targetResolution = filter.videoResolution.target.width * filter.videoResolution.target.height;
        const leftDiff = Math.abs(leftVideoResolution - targetResolution);
        const rightDiff = Math.abs(rightVideoResolution - targetResolution);
        if (leftDiff < rightDiff) leftPoints += filter.videoResolution.priority;
        if (rightDiff < leftDiff) rightPoints += filter.videoResolution.priority;
      }
    }

    const leftPhotoResolution = bestFormat.photoWidth * bestFormat.photoHeight;
    const rightPhotoResolution = format.photoWidth * format.photoHeight;
    if (filter.photoResolution != null) {
      if (filter.photoResolution.target === 'max') {
        // We just want the maximum resolution
        if (leftPhotoResolution > rightPhotoResolution) leftPoints += filter.photoResolution.priority;
        if (rightPhotoResolution > leftPhotoResolution) rightPoints += filter.photoResolution.priority;
      } else {
        // Find closest photo resolution to the filter (ignoring orientation)
        const targetResolution = filter.photoResolution.target.width * filter.photoResolution.target.height;
        const leftDiff = Math.abs(leftPhotoResolution - targetResolution);
        const rightDiff = Math.abs(rightPhotoResolution - targetResolution);
        if (leftDiff < rightDiff) leftPoints += filter.photoResolution.priority;
        if (rightDiff < leftDiff) rightPoints += filter.photoResolution.priority;
      }
    }

    // Find closest aspect ratio (video)
    if (filter.videoAspectRatio != null) {
      const leftAspect = bestFormat.videoWidth / bestFormat.videoHeight;
      const rightAspect = format.videoWidth / format.videoHeight;
      const leftDiff = Math.abs(leftAspect - filter.videoAspectRatio.target);
      const rightDiff = Math.abs(rightAspect - filter.videoAspectRatio.target);
      if (leftDiff < rightDiff) leftPoints += filter.videoAspectRatio.priority;
      if (rightDiff < leftDiff) rightPoints += filter.videoAspectRatio.priority;
    }

    // Find closest aspect ratio (photo)
    if (filter.photoAspectRatio != null) {
      const leftAspect = bestFormat.photoWidth / bestFormat.photoHeight;
      const rightAspect = format.photoWidth / format.photoHeight;
      const leftDiff = Math.abs(leftAspect - filter.photoAspectRatio.target);
      const rightDiff = Math.abs(rightAspect - filter.photoAspectRatio.target);
      if (leftDiff < rightDiff) leftPoints += filter.photoAspectRatio.priority;
      if (rightDiff < leftDiff) rightPoints += filter.photoAspectRatio.priority;
    }

    // Find closest max FPS
    if (filter.fps != null) {
      if (bestFormat.maxFps >= filter.fps.target) leftPoints += filter.fps.priority;
      if (format.maxFps >= filter.fps.target) rightPoints += filter.fps.priority;
    }

    // Find video stabilization mode
    if (filter.videoStabilizationMode != null) {
      if (bestFormat.videoStabilizationModes.includes(filter.videoStabilizationMode.target)) leftPoints++;
      if (format.videoStabilizationModes.includes(filter.videoStabilizationMode.target)) rightPoints++;
    }

    // Find pixel format
    if (filter.pixelFormat != null) {
      if (bestFormat.pixelFormats.includes(filter.pixelFormat.target)) leftPoints++;
      if (format.pixelFormats.includes(filter.pixelFormat.target)) rightPoints++;
    }

    // Find Photo HDR formats
    if (filter.photoHDR != null) {
      if (bestFormat.supportsPhotoHDR === filter.photoHDR.target) leftPoints++;
      if (format.supportsPhotoHDR === filter.photoHDR.target) rightPoints++;
    }

    // Find Video HDR formats
    if (filter.videoHDR != null) {
      if (bestFormat.supportsVideoHDR === filter.videoHDR.target) leftPoints++;
      if (format.supportsVideoHDR === filter.videoHDR.target) rightPoints++;
    }

    if (rightPoints > leftPoints) bestFormat = format;
  }

  return bestFormat;
}
