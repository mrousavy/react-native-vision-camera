"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CameraDevices = void 0;
var _reactNative = require("react-native");
const CameraDevicesManager = _reactNative.NativeModules.CameraDevices;
const constants = CameraDevicesManager.getConstants();
let devices = constants.availableCameraDevices;
const DEVICES_CHANGED_NAME = 'CameraDevicesChanged';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventEmitter = new _reactNative.NativeEventEmitter(CameraDevicesManager);
eventEmitter.addListener(DEVICES_CHANGED_NAME, newDevices => {
  devices = newDevices;
});
const CameraDevices = exports.CameraDevices = {
  userPreferredCameraDevice: constants.userPreferredCameraDevice,
  getAvailableCameraDevices: () => devices,
  addCameraDevicesChangedListener: callback => {
    return eventEmitter.addListener(DEVICES_CHANGED_NAME, callback);
  }
};
//# sourceMappingURL=CameraDevices.js.map