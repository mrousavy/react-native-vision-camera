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
export declare const sortDevices: (left: CameraDevice, right: CameraDevice) => number;
/**
 * Sort formats by resolution and aspect ratio difference (to the Screen size).
 *
 * > Note that this makes the `sort()` function descending, so the first element (`[0]`) is the "best" device.
 */
export declare const sortFormats: (left: CameraDeviceFormat, right: CameraDeviceFormat) => number;
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
export declare const frameRateIncluded: (range: FrameRateRange, fps: number) => boolean;
