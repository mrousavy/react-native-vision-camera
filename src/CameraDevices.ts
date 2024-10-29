import { NativeModules, NativeEventEmitter } from 'react-native'
import type { CameraDevice } from './types/CameraDevice'

const CameraDevicesManager = NativeModules.CameraDevices as {
  getConstants: () => {
    availableCameraDevices: CameraDevice[]
    userPreferredCameraDevice: CameraDevice | undefined
  }
}

const constants = CameraDevicesManager.getConstants()
let devices = constants.availableCameraDevices

const DEVICES_CHANGED_NAME = 'CameraDevicesChanged'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventEmitter = new NativeEventEmitter(CameraDevicesManager as any)
eventEmitter.addListener(DEVICES_CHANGED_NAME, (newDevices: CameraDevice[]) => {
  devices = newDevices
})

export const CameraDevices = {
  userPreferredCameraDevice: constants.userPreferredCameraDevice,
  getAvailableCameraDevices: () => devices,
  addCameraDevicesChangedListener: (callback: (newDevices: CameraDevice[]) => void) => {
    return eventEmitter.addListener(DEVICES_CHANGED_NAME, callback)
  },
}
