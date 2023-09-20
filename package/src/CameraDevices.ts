import { NativeModules, NativeEventEmitter } from 'react-native';
import { CameraDevice } from './CameraDevice';

const CameraDevicesManager = NativeModules.CameraDevices as {
  getConstants: () => {
    availableCameraDevices: CameraDevice[];
  };
};

const constants = CameraDevicesManager.getConstants();
let devices = constants.availableCameraDevices;

const DEVICES_CHANGED_NAME = 'CameraDevicesChanged';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventEmitter = new NativeEventEmitter(CameraDevicesManager as any);
eventEmitter.addListener(DEVICES_CHANGED_NAME, (newDevices: CameraDevice[]) => {
  devices = newDevices;
});

/**
 * The Camera Devices API.
 *
 * It is safe to call {@linkcode CameraDevices.getAvailableCameraDevices | getAvailableCameraDevices()} if you only care about Camera devices attached to the phone.
 *
 * If you are using external Camera devices (USB cameras, Mac continuity cameras, etc.) the available Camera Devices could change over time when the external Camera device gets plugged in or plugged out, so use {@linkcode CameraDevices.addCameraDevicesChangedListener | addCameraDevicesChangedListener(..)} to listen for such changes.
 */
export const CameraDevices = {
  /**
   * The currently available Camera Devices.
   * For Camera Devices attached to the phone, it is safe to assume that this will never change.
   * For external Camera Devices (USB cameras, Mac continuity cameras, etc.) the available Camera Devices could change over time when the external Camera device gets plugged in or plugged out, so use {@link addCameraDevicesChangedListener} to listen for such changes.
   */
  getAvailableCameraDevices: () => devices,
  addCameraDevicesChangedListener: (callback: (newDevices: CameraDevice[]) => void) => {
    return eventEmitter.addListener(DEVICES_CHANGED_NAME, callback);
  },
};
