import type { CameraDevice } from './types/CameraDevice';
export declare const CameraDevices: {
    userPreferredCameraDevice: CameraDevice | undefined;
    getAvailableCameraDevices: () => CameraDevice[];
    addCameraDevicesChangedListener: (callback: (newDevices: CameraDevice[]) => void) => import("react-native").EmitterSubscription;
};
//# sourceMappingURL=CameraDevices.d.ts.map