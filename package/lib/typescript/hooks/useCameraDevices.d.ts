import type { CameraDevice } from '../types/CameraDevice';
/**
 * Get all available Camera Devices this phone has.
 *
 * Camera Devices attached to this phone (`back` or `front`) are always available,
 * while `external` devices might be plugged in or out at any point,
 * so the result of this function might update over time.
 */
export declare function useCameraDevices(): CameraDevice[];
//# sourceMappingURL=useCameraDevices.d.ts.map