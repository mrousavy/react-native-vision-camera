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
  videoResolution?: Size;
  /**
   * The target resolution of the photo output pipeline.
   * If no format supports the given resolution, the format closest to this value will be used.
   */
  photoResolution?: Size;
  /**
   * The target aspect ratio of the video (and preview) output, expressed as a factor: `width / height`.
   *
   * In most cases, you want this to be as close to the screen's aspect ratio as possible (usually ~9:16).
   *
   * @example
   * ```ts
   * const screen = Dimensions.get('screen')
   * targetVideoAspectRatio: screen.width / screen.height
   * ```
   */
  videoAspectRatio?: number;
  /**
   * The target aspect ratio of the photo output, expressed as a factor: `width / height`.
   *
   * In most cases, you want this to be the same as `targetVideoAspectRatio`, which you often want
   * to be as close to the screen's aspect ratio as possible (usually ~9:16)
   *
   * @example
   * ```ts
   * const screen = Dimensions.get('screen')
   * targetPhotoAspectRatio: screen.width / screen.height
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
}

/**
 * Get the best matching Camera format for the given device that satisfies your requirements using a sorting filter. By default, formats are sorted by highest to lowest resolution.
 * @param device The Camera Device you're currently using
 * @param filters The filter you want to use. The format that matches your filter the closest will be returned. The filter is ranked by priority, descending.
 * @returns The format that matches your filter the closest.
 */
export function getCameraFormat(device: CameraDevice, filters: FormatFilter[]): CameraDeviceFormat {
  const copy = [...device.formats];
  const sortedFormats = copy.sort((left, right) => {
    let leftPoints = 0;
    let rightPoints = 0;

    // Loop through each filter in the filters array - they are sorted by priority.
    filters.forEach((filter, index) => {
      const priority = filters.length - index;

      const leftVideoResolution = left.videoWidth * left.videoHeight;
      const rightVideoResolution = right.videoWidth * right.videoHeight;
      if (filter.videoResolution != null) {
        // Find video resolution closest to the filter (ignoring orientation)
        const targetResolution = filter.videoResolution.width * filter.videoResolution.height;
        const leftDiff = Math.abs(leftVideoResolution - targetResolution);
        const rightDiff = Math.abs(rightVideoResolution - targetResolution);
        if (leftDiff < rightDiff) leftPoints += priority;
        else if (rightDiff < leftDiff) rightPoints += priority;
      } else {
        // No filter is set, so just prefer higher resolutions
        if (leftVideoResolution > rightVideoResolution) leftPoints++;
        else if (rightVideoResolution > leftVideoResolution) rightPoints++;
      }

      const leftPhotoResolution = left.photoWidth * left.photoHeight;
      const rightPhotoResolution = right.photoWidth * right.photoHeight;
      if (filter.photoResolution != null) {
        // Find closest photo resolution to the filter (ignoring orientation)
        const targetResolution = filter.photoResolution.width * filter.photoResolution.height;
        const leftDiff = Math.abs(leftPhotoResolution - targetResolution);
        const rightDiff = Math.abs(rightPhotoResolution - targetResolution);
        if (leftDiff < rightDiff) leftPoints += priority;
        else if (rightDiff < leftDiff) rightPoints += priority;
      } else {
        // No filter is set, so just prefer higher resolutions
        if (leftPhotoResolution > rightPhotoResolution) leftPoints++;
        else if (rightPhotoResolution > leftPhotoResolution) rightPoints++;
      }

      // Find closest aspect ratio (video)
      if (filter.videoAspectRatio != null) {
        const leftAspect = left.videoWidth / right.videoHeight;
        const rightAspect = right.videoWidth / right.videoHeight;
        const leftDiff = Math.abs(leftAspect - filter.videoAspectRatio);
        const rightDiff = Math.abs(rightAspect - filter.videoAspectRatio);
        if (leftDiff < rightDiff) leftPoints += priority;
        else if (rightDiff < leftDiff) rightPoints += priority;
      }

      // Find closest aspect ratio (photo)
      if (filter.photoAspectRatio != null) {
        const leftAspect = left.photoWidth / right.photoHeight;
        const rightAspect = right.photoWidth / right.photoHeight;
        const leftDiff = Math.abs(leftAspect - filter.photoAspectRatio);
        const rightDiff = Math.abs(rightAspect - filter.photoAspectRatio);
        if (leftDiff < rightDiff) leftPoints += priority;
        else if (rightDiff < leftDiff) rightPoints += priority;
      }

      // Find closest max FPS
      if (filter.fps != null) {
        const leftDiff = Math.abs(left.maxFps - filter.fps);
        const rightDiff = Math.abs(right.maxFps - filter.fps);
        if (leftDiff < rightDiff) leftPoints += priority;
        else if (rightDiff < leftDiff) rightPoints += priority;
      }

      // Find video stabilization mode
      if (filter.videoStabilizationMode != null) {
        if (left.videoStabilizationModes.includes(filter.videoStabilizationMode)) leftPoints++;
        if (right.videoStabilizationModes.includes(filter.videoStabilizationMode)) rightPoints++;
      }

      // Find pixel format
      if (filter.pixelFormat != null) {
        if (left.pixelFormats.includes(filter.pixelFormat)) leftPoints++;
        if (right.pixelFormats.includes(filter.pixelFormat)) rightPoints++;
      }
    });

    return rightPoints - leftPoints;
  });

  const format = sortedFormats[0];
  if (format == null)
    throw new CameraRuntimeError('device/invalid-device', `The given Camera Device (${device.id}) does not have any formats!`);
  return format;
}
