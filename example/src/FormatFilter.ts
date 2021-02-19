import {
  RESOLUTION_LIMIT,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  USE_ULTRAWIDE_IF_AVAILABLE,
} from "./Constants";
import type {
  CameraDevice,
  CameraDeviceFormat,
  FrameRateRange,
} from "react-native-vision-camera";

/**
 * Compares two devices with the following criteria:
 * * Cameras with wide-angle-cameras are 5x **better** than cameras without.
 * * Cameras with ultra-wide-angle-cameras are 5x **worse** than cameras without.
 * * Cameras with more physical devices are "better"
 *
 * @returns
 * * `-1` if left is BETTER than right
 * * `0` if left equals right
 * * `1` if left is WORSE than right
 *
 * Note that this makes the `sort()` function descending, so the first element (`[0]`) is the "best" device.
 */
export const compareDevices = (
  left: CameraDevice,
  right: CameraDevice
): -1 | 0 | 1 => {
  let leftPoints = 0;

  const leftHasWideAngle = left.devices.includes("wide-angle-camera");
  const rightHasWideAngle = right.devices.includes("wide-angle-camera");
  if (leftHasWideAngle && !rightHasWideAngle) {
    // left does have a wide-angle-camera, but right doesn't.
    leftPoints += 5;
  } else if (!leftHasWideAngle && rightHasWideAngle) {
    // left doesn't have a wide-angle-camera, but right does.
    leftPoints -= 5;
  }

  if (!USE_ULTRAWIDE_IF_AVAILABLE) {
    const leftHasUltraWideAngle = left.devices.includes(
      "ultra-wide-angle-camera"
    );
    const rightHasUltraWideAngle = right.devices.includes(
      "ultra-wide-angle-camera"
    );
    if (leftHasUltraWideAngle && !rightHasUltraWideAngle) {
      // left does have an ultra-wide-angle-camera, but right doesn't. Ultra-Wide cameras are bad because of their poor quality.
      leftPoints -= 5;
    } else if (!leftHasUltraWideAngle && rightHasUltraWideAngle) {
      // left doesn't have an ultra-wide-angle-camera, but right does. Ultra-Wide cameras are bad because of their poor quality.
      leftPoints += 5;
    }
  }

  if (left.devices.length > right.devices.length) {
    // left has more devices than right
    leftPoints += 1;
  } else if (left.devices.length < right.devices.length) {
    // left has less more devices than right
    leftPoints -= 1;
  }

  if (leftPoints > 0) return -1;
  if (leftPoints < 0) return 1;
  return 0;
};

type Size = { width: number; height: number };
const CAMERA_VIEW_SIZE: Size = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

const applyScaledMask = (
  clippedElementDimensions: Size, // 3024 x 4032 | 2160x3840
  maskDimensions: Size //            375  x 623
): Size => {
  const wScale = maskDimensions.width / clippedElementDimensions.width;
  const hScale = maskDimensions.height / clippedElementDimensions.height;

  if (wScale < hScale) {
    return {
      width: maskDimensions.width / hScale,
      height: clippedElementDimensions.height,
    };
  } else {
    return {
      width: clippedElementDimensions.width,
      height: maskDimensions.height / wScale,
    };
  }
};

/**
 * Compares two Formats with the following comparators:
 * * Photo Dimensions (higher is better) (weights x3)
 * * Video Dimensions (higher is better) (weights x2)
 * * Max FPS (higher is better) (weights x2)
 * * HDR Support (true is better) (weights x2)
 * * Max Zoom Factor (higher is better) (weights x1)
 * * MaxISO (higher is better) (weights x1)
 * * MinISO (lower is better) (weights x1)
 *
 * @returns
 * * `-1` if left is BETTER than right
 * * `0` if left equals right
 * * `1` if left is WORSE than right
 *
 * Note that this makes the `sort()` function descending, so the first element (`[0]`) is the "best" format.
 */
export const compareFormats = (
  left: CameraDeviceFormat,
  right: CameraDeviceFormat
): -1 | 0 | 1 => {
  // Point score of the left format. Higher is better.
  let leftPoints = 0;

  const leftPhotoPixels = left.photoHeight * left.photoWidth;
  const rightPhotoPixels = right.photoHeight * right.photoWidth;
  if (leftPhotoPixels > rightPhotoPixels) {
    // left has greater photo dimensions
    const isLeftAbovePixelLimit =
      RESOLUTION_LIMIT != null && leftPhotoPixels > RESOLUTION_LIMIT;
    if (isLeftAbovePixelLimit) {
      // left exceeds our pixel limit
      leftPoints -= 3;
    } else {
      // left does not exceed our pixel limit
      leftPoints += 3;
    }
  } else if (leftPhotoPixels < rightPhotoPixels) {
    // left has smaller photo dimensions
    const isRightAbovePixelLimit =
      RESOLUTION_LIMIT != null && rightPhotoPixels > RESOLUTION_LIMIT;
    if (isRightAbovePixelLimit) {
      // right exceeds our pixel limit
      leftPoints += 3;
    } else {
      // right does not exceed our pixel limit
      leftPoints -= 3;
    }
  }

  const leftCropped = applyScaledMask(
    { width: left.photoHeight, height: left.photoWidth }, // cameras are horizontal, we rotate to portrait
    CAMERA_VIEW_SIZE
  );
  const rightCropped = applyScaledMask(
    { width: right.photoHeight, height: right.photoWidth }, // cameras are horizontal, we rotate to portrait
    CAMERA_VIEW_SIZE
  );
  const leftOverflow =
    left.photoWidth * left.photoHeight - leftCropped.width * leftCropped.height;
  const rightOverflow =
    right.photoWidth * right.photoHeight -
    rightCropped.width * rightCropped.height;
  if (leftOverflow > rightOverflow) {
    // left has a higher overflow, aka more pixels that aren't on-screen and therefore wasted. Maybe left is 4:3 and right is 16:9
    leftPoints -= 4;
  } else if (leftOverflow < rightOverflow) {
    // right has a higher overflow, aka more pixels that aren't on-screen and therefore wasted. Maybe right is 4:3 and left is 16:9
    leftPoints += 4;
  }

  if (
    left.videoHeight != null &&
    left.videoWidth != null &&
    right.videoHeight != null &&
    right.videoWidth != null
  ) {
    const leftVideoPixels = left.videoWidth * left.videoHeight ?? 0;
    const rightVideoPixels = right.videoWidth * right.videoHeight ?? 0;
    if (leftVideoPixels > rightVideoPixels) {
      // left has greater video dimensions
      leftPoints += 2;
    } else if (leftVideoPixels < rightVideoPixels) {
      // left has smaller video dimensions
      leftPoints -= 2;
    }
  }

  const leftMaxFps = Math.max(
    ...left.frameRateRanges.map((r) => r.maxFrameRate)
  );
  const rightMaxFps = Math.max(
    ...right.frameRateRanges.map((r) => r.maxFrameRate)
  );
  if (leftMaxFps > rightMaxFps) {
    // left has more fps
    leftPoints += 2;
  } else if (leftMaxFps < rightMaxFps) {
    // left has less fps
    leftPoints -= 2;
  }

  if (left.supportsVideoHDR && !right.supportsVideoHDR) {
    // left does support video HDR, right doesn't
    leftPoints += 1;
  } else if (!left.supportsVideoHDR && right.supportsVideoHDR) {
    // left doesn't support video HDR, right does
    leftPoints -= 1;
  }

  if (left.supportsPhotoHDR && !right.supportsPhotoHDR) {
    // left does support photo HDR, right doesn't
    leftPoints += 1;
  } else if (!left.supportsPhotoHDR && right.supportsPhotoHDR) {
    // left doesn't support photo HDR, right does
    leftPoints -= 1;
  }

  if (leftPoints > 0) return -1;
  if (leftPoints < 0) return 1;
  return 0;
};

/**
 * Selects the smallest difference between a FrameRateRange's `maxFrameRate` and the given `fps`
 */
const smallestFpsDiff = (
  frameRateRanges: FrameRateRange[],
  fps: number
): number => {
  const bestFrameRateRange = frameRateRanges.reduce<FrameRateRange | undefined>(
    (prev, curr) => {
      if (prev == null) return curr;

      const prevDiff = Math.abs(prev.maxFrameRate - fps);
      const currDiff = Math.abs(curr.maxFrameRate - fps);
      if (prevDiff < currDiff) return prev;
      else return curr;
    },
    undefined
  );
  const max = bestFrameRateRange?.maxFrameRate ?? 0;
  return Math.abs(max - fps);
};

export const frameRateIncluded = (
  range: FrameRateRange,
  fps: number
): boolean => fps >= range.minFrameRate && fps <= range.maxFrameRate;

const isFpsInFrameRateRange = (
  format: CameraDeviceFormat,
  fps: number
): boolean => format.frameRateRanges.some((r) => frameRateIncluded(r, fps));

/**
 * Selects the format with the closest frame rate ranges to the FPS
 */
export const formatWithClosestMatchingFps = (
  formats: CameraDeviceFormat[],
  fps: number
): CameraDeviceFormat | undefined =>
  formats.reduce<CameraDeviceFormat | undefined>((prev, curr) => {
    if (prev == null) return curr;

    // if range is 3-30 and FPS is 31, it doesn't match.
    if (!isFpsInFrameRateRange(curr, fps)) return prev;

    const prevFpsDiff = smallestFpsDiff(prev.frameRateRanges, fps);
    const currFpsDiff = smallestFpsDiff(curr.frameRateRanges, fps);
    if (currFpsDiff < prevFpsDiff) return curr;
    else return prev;
  }, undefined);
