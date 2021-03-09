import { Dimensions } from 'react-native';
import type { CameraDevice, CameraDeviceFormat, FrameRateRange } from 'react-native-vision-camera';

/**
 * Compares two devices by the following criteria:
 * * `wide-angle-camera`s are ranked higher than others
 * * Devices with more physical cameras are ranked higher than ones with less. (e.g. "Triple Camera" > "Wide-Angle Camera")
 *
 * > Note that this makes the `sort()` function descending, so the first element (`[0]`) is the "best" device.
 *
 * @example
 * ```ts
 * const devices = camera.devices.sort(sortDevices)
 * const bestDevice = devices[0]
 * ```
 * @method
 */
export const sortDevices = (left: CameraDevice, right: CameraDevice): number => {
  let leftPoints = 0;
  let rightPoints = 0;

  const leftHasWideAngle = left.devices.includes('wide-angle-camera');
  const rightHasWideAngle = right.devices.includes('wide-angle-camera');
  if (leftHasWideAngle) leftPoints += 5;
  if (rightHasWideAngle) rightPoints += 5;

  if (left.devices.length > right.devices.length) leftPoints += 2;
  if (right.devices.length > left.devices.length) rightPoints += 2;

  return rightPoints - leftPoints;
};

/**
 * Represents a Size in any unit.
 */
export type Size = {
  /**
   * Points in width.
   */
  width: number;
  /**
   * Points in height.
   */
  height: number;
};
const SCREEN_SIZE: Size = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};
const applyScaledMask = (
  clippedElementDimensions: Size, // 12 x 12
  maskDimensions: Size, //            6 x 12
): Size => {
  const wScale = maskDimensions.width / clippedElementDimensions.width; //   0.5
  const hScale = maskDimensions.height / clippedElementDimensions.height; // 1.0

  if (wScale > hScale) {
    return {
      width: maskDimensions.width / hScale,
      height: maskDimensions.height / hScale,
    };
  } else {
    return {
      width: maskDimensions.width / wScale,
      height: maskDimensions.height / wScale,
    };
  }
};

const getFormatAspectRatioOverflow = (format: CameraDeviceFormat, size: Size): number => {
  const downscaled = applyScaledMask(
    size,
    // cameras are landscape, so we intentionally rotate
    { width: format.photoHeight, height: format.photoWidth },
  );
  return downscaled.width * downscaled.height - size.width * size.height;
};

/**
 * Filters Camera Device Formats by the best matching aspect ratio for the given `viewSize`.
 *
 * @param {CameraDeviceFormat[]} formats A list of formats the current device has (see {@linkcode CameraDevice.formats})
 * @param {Size} viewSize The size of the camera view which will be used to find the best aspect ratio. Defaults to the screen size.
 * @returns A list of Camera Device Formats that match the given `viewSize`' aspect ratio _as close as possible_.
 *
 * @example
 * ```ts
 * const formats = useMemo(() => filterFormatsByAspectRatio(device.formats, CAMERA_VIEW_SIZE), [device.formats])
 * ```
 * @method
 */
export const filterFormatsByAspectRatio = (formats: CameraDeviceFormat[], viewSize = SCREEN_SIZE): CameraDeviceFormat[] => {
  const minOverflow = formats.reduce((prev, curr) => {
    const overflow = getFormatAspectRatioOverflow(curr, viewSize);
    if (overflow < prev) return overflow;
    else return prev;
  }, Number.MAX_SAFE_INTEGER);

  return formats.filter((f) => getFormatAspectRatioOverflow(f, viewSize) === minOverflow);
};

/**
 * Sorts Camera Device Formats by highest photo-capture resolution, descending. Use this in a `.sort` function.
 *
 * @example
 * ```ts
 * const formats = useMemo(() => device.formats.sort(sortFormatsByResolution), [device.formats])
 * const bestFormat = formats[0]
 * ```
 * @method
 */
export const sortFormatsByResolution = (left: CameraDeviceFormat, right: CameraDeviceFormat): number => {
  let leftPoints = left.photoHeight * left.photoWidth;
  let rightPoints = right.photoHeight * right.photoWidth;

  if (left.videoHeight != null && left.videoWidth != null && right.videoHeight != null && right.videoWidth != null) {
    leftPoints += left.videoWidth * left.videoHeight;
    rightPoints += right.videoWidth * right.videoHeight;
  }

  // "returns a negative value if left is better than one"
  return rightPoints - leftPoints;
};

/**
 * Returns `true` if the given Frame Rate Range (`range`) contains the given frame rate (`fps`)
 *
 * @param {FrameRateRange} range The range to check if the given `fps` are included in
 * @param {number} fps The FPS to check if the given `range` supports.
 * @example
 * ```ts
 * // get all formats that support 60 FPS
 * const formatsWithHighFps = useMemo(() => device.formats.filter((f) => f.frameRateRanges.some((r) => frameRateIncluded(r, 60))), [device.formats])
 * ```
 * @method
 */
export const frameRateIncluded = (range: FrameRateRange, fps: number): boolean => fps >= range.minFrameRate && fps <= range.maxFrameRate;
