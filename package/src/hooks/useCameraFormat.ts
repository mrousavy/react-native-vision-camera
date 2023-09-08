import { useMemo } from 'react';
import type { CameraDevice, CameraDeviceFormat, VideoStabilizationMode } from '../CameraDevice';
import { sortFormats } from '../utils/FormatFilter';
import { CameraRuntimeError } from '../CameraError';

interface WithPriority<T> {
  /**
   * The target value for this specific requirement
   */
  target: T;
  /**
   * The priority of this requirement.
   * Filters with higher priority can take precedence over filters with lower priority.
   *
   * For example, if we have two formats:
   * ```json
   * [
   *   videoWidth: 3840,
   *   videoHeight: 2160,
   *   maxFps: 30,
   *   ...
   * ],
   * [
   *   videoWidth: 1920,
   *   videoHeight: 1080,
   *   maxFps: 60,
   *   ...
   * ]
   * ```
   * And your filter looks like this:
   * ```json
   * {
   *   fps: { target: 60, priority: 1 }
   *   videoSize: { target: { width: 4000, height: 2000 }, priority: 3 }
   * }
   * ```
   * The 4k format will be chosen since the `videoSize` filter has a higher priority (2) than the `fps` filter (1).
   *
   * To choose the 60 FPS format instead, use a higher priority for the `fps` filter:
   * ```json
   * {
   *   fps: { target: 60, priority: 2 }
   *   videoSize: { target: { width: 4000, height: 2000 }, priority: 1 }
   * }
   * ```
   */
  priority: number;
}

interface Size {
  width: number;
  height: number;
}

interface Filter {
  /**
   * The target resolution of the video (and frame processor) output pipeline.
   * If no format supports the given resolution, the format closest to this value will be used.
   */
  targetVideoResolution?: WithPriority<Size>;
  /**
   * The target resolution of the photo output pipeline.
   * If no format supports the given resolution, the format closest to this value will be used.
   */
  targetPhotoResolution?: WithPriority<Size>;
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
  targetVideoAspectRatio?: WithPriority<number>;
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
  targetPhotoAspectRatio?: WithPriority<number>;
  /**
   * The target FPS you want to record video at.
   * If the FPS requirements can not be met, the format closest to this value will be used.
   */
  targetFps?: WithPriority<number>;
  /**
   * The target video stabilization mode you want to use.
   * If no format supports the target video stabilization mode, the best other matching format will be used.
   */
  targetVideoStabilizationMode?: WithPriority<VideoStabilizationMode>;
}

/**
 * Get the best matching Camera format for the given device that satisfies your requirements using a sorting filter.
 * @param device The Camera Device you're currently using
 * @param filter The filter you want to use. The format that matches your filter the closest will be returned
 * @returns The format that matches your filter the closest.
 */
export function getCameraFormat(device: CameraDevice, filter: Filter): CameraDeviceFormat {
  const copy = [...device.formats];
  const sortedFormats = copy.sort((left, right) => {
    let leftPoints = 0;
    let rightPoints = 0;

    // Find closest video resolution (ignoring orientation)
    if (filter.targetVideoResolution != null) {
      const leftResolution = left.videoWidth * left.videoHeight;
      const rightResolution = right.videoWidth * right.videoHeight;
      const targetResolution = filter.targetVideoResolution.target.width * filter.targetVideoResolution.target.height;
      const leftDiff = Math.abs(leftResolution - targetResolution);
      const rightDiff = Math.abs(rightResolution - targetResolution);
      if (leftDiff < rightDiff) leftPoints++;
      else if (rightDiff < leftDiff) rightPoints++;
    }

    // Find closest photo resolution (ignoring orientation)
    if (filter.targetPhotoResolution != null) {
      const leftResolution = left.photoWidth * left.photoHeight;
      const rightResolution = right.photoWidth * right.photoHeight;
      const targetResolution = filter.targetPhotoResolution.target.width * filter.targetPhotoResolution.target.height;
      const leftDiff = Math.abs(leftResolution - targetResolution);
      const rightDiff = Math.abs(rightResolution - targetResolution);
      if (leftDiff < rightDiff) leftPoints++;
      else if (rightDiff < leftDiff) rightPoints++;
    }

    // Find closest aspect ratio (video)
    if (filter.targetVideoAspectRatio != null) {
      const leftAspect = left.videoWidth / right.videoHeight;
      const rightAspect = right.videoWidth / right.videoHeight;
      const leftDiff = Math.abs(leftAspect - filter.targetVideoAspectRatio.target);
      const rightDiff = Math.abs(rightAspect - filter.targetVideoAspectRatio.target);
      if (leftDiff < rightDiff) leftPoints++;
      else if (rightDiff < leftDiff) rightPoints++;
    }

    // Find closest aspect ratio (photo)
    if (filter.targetPhotoAspectRatio != null) {
      const leftAspect = left.photoWidth / right.photoHeight;
      const rightAspect = right.photoWidth / right.photoHeight;
      const leftDiff = Math.abs(leftAspect - filter.targetPhotoAspectRatio.target);
      const rightDiff = Math.abs(rightAspect - filter.targetPhotoAspectRatio.target);
      if (leftDiff < rightDiff) leftPoints++;
      else if (rightDiff < leftDiff) rightPoints++;
    }

    // Find closest max FPS
    if (filter.targetFps != null) {
      const leftDiff = Math.abs(left.maxFps - filter.targetFps.target);
      const rightDiff = Math.abs(right.maxFps - filter.targetFps.target);
      if (leftDiff < rightDiff) leftPoints++;
      else if (rightDiff < leftDiff) rightPoints++;
    }

    // Find video stabilization mode
    if (filter.targetVideoStabilizationMode != null) {
      if (left.videoStabilizationModes.includes(filter.targetVideoStabilizationMode.target)) leftPoints++;
      if (right.videoStabilizationModes.includes(filter.targetVideoStabilizationMode.target)) rightPoints++;
    }

    return rightPoints - leftPoints;
  });

  const format = sortedFormats[0];
  if (format == null)
    throw new CameraRuntimeError('device/invalid-device', `The given Camera Device (${device.id}) does not have any formats!`);
  return format;
}

/**
 * Get the best matching Camera format for the given device that satisfies your requirements using a sorting filter.
 * @param device The Camera Device you're currently using
 * @param filter The filter you want to use. The format that matches your filter the closest will be returned
 * @returns The format that matches your filter the closest.
 */
export function useCameraFormat(device: CameraDevice | undefined, filter: Filter): CameraDeviceFormat | undefined {
  const format = useMemo(() => {
    if (device == null) return undefined;
    return getCameraFormat(device, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, JSON.stringify(filter)]);

  return format;
}
