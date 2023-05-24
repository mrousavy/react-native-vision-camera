import type { CameraPosition } from '../CameraPosition';
import { CameraDevice, LogicalCameraDeviceType, PhysicalCameraDeviceType } from '../CameraDevice';
export declare type CameraDevices = {
    [key in CameraPosition]: CameraDevice | undefined;
};
/**
 * Gets the best available {@linkcode CameraDevice}. Devices with more cameras are preferred.
 *
 * @returns The best matching {@linkcode CameraDevice}.
 * @throws {@linkcode CameraRuntimeError} if no device was found.
 * @example
 * ```tsx
 * const device = useCameraDevice()
 * // ...
 * return <Camera device={device} />
 * ```
 */
export declare function useCameraDevices(): CameraDevices;
/**
 * Gets a {@linkcode CameraDevice} for the requested device type.
 *
 * @param {PhysicalCameraDeviceType | LogicalCameraDeviceType} deviceType Specifies a device type which will be used as a device filter.
 * @returns A {@linkcode CameraDevice} for the requested device type.
 * @throws {@linkcode CameraRuntimeError} if no device was found.
 * @example
 * ```tsx
 * const device = useCameraDevice('wide-angle-camera')
 * // ...
 * return <Camera device={device} />
 * ```
 */
export declare function useCameraDevices(deviceType: PhysicalCameraDeviceType | LogicalCameraDeviceType): CameraDevices;
