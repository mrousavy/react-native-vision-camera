import { NativeModules, NativeEventEmitter } from 'react-native';
const CameraDevicesManager = NativeModules.CameraDevices;
const constants = CameraDevicesManager.getConstants();
let devices = constants.availableCameraDevices;
const DEVICES_CHANGED_NAME = 'CameraDevicesChanged';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventEmitter = new NativeEventEmitter(CameraDevicesManager);
eventEmitter.addListener(DEVICES_CHANGED_NAME, newDevices => {
  devices = newDevices;
});
export const CameraDevices = {
  userPreferredCameraDevice: constants.userPreferredCameraDevice,
  getAvailableCameraDevices: () => devices,
  addCameraDevicesChangedListener: callback => {
    return eventEmitter.addListener(DEVICES_CHANGED_NAME, callback);
  }
};
//# sourceMappingURL=CameraDevices.js.map