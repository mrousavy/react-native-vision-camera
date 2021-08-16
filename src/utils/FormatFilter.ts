import { Dimensions } from 'react-native';
import type { CameraDevice, CameraDeviceFormat, FrameRateRange } from '../CameraDevice';

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
  if (leftHasWideAngle) leftPoints += 2;
  if (rightHasWideAngle) rightPoints += 2;

  // telephoto cameras often have very poor quality.
  const leftHasTelephoto = left.devices.includes('telephoto-camera');
  const rightHasTelephoto = right.devices.includes('telephoto-camera');
  if (leftHasTelephoto) leftPoints -= 2;
  if (rightHasTelephoto) rightPoints -= 2;

  if (left.devices.length > right.devices.length) leftPoints += 1;
  if (right.devices.length > left.devices.length) rightPoints += 1;

  return rightPoints - leftPoints;
};

const SCREEN_SIZE = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};
const SCREEN_ASPECT_RATIO = SCREEN_SIZE.width / SCREEN_SIZE.height;

/**
 * Sort formats by resolution and aspect ratio difference (to the Screen size).
 *
 * > Note that this makes the `sort()` function descending, so the first element (`[0]`) is the "best" device.
 */
export const sortFormats = (left: CameraDeviceFormat, right: CameraDeviceFormat): number => {
  let leftPoints = 0,
    rightPoints = 0;

  // we downscale the points so much that we are in smaller number ranges for future calculations
  // e.g. for 4k (4096), this adds 8 points.
  leftPoints += Math.round(left.photoWidth / 500);
  rightPoints += Math.round(right.photoWidth / 500);
  // e.g. for 4k (4096), this adds 8 points.
  leftPoints += Math.round(left.videoWidth / 500);
  rightPoints += Math.round(right.videoWidth / 500);

  // we downscale the points here as well, so if left has 16:9 and right has 21:9, this roughly
  // adds 5 points. If the difference is smaller, e.g. 16:9 vs 17:9, this roughly adds a little
  // bit over 1 point, just enough to overrule the FPS below.
  const leftAspectRatioDiff = left.photoHeight / left.photoWidth - SCREEN_ASPECT_RATIO;
  const rightAspectRatioDiff = right.photoHeight / right.photoWidth - SCREEN_ASPECT_RATIO;
  leftPoints -= Math.abs(leftAspectRatioDiff) * 10;
  rightPoints -= Math.abs(rightAspectRatioDiff) * 10;

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
