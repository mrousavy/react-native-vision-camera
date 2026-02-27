import { NativeModules, NativeEventEmitter, Platform } from 'react-native'
import type { CameraDevice } from './types/CameraDevice'

const CameraDevicesManager = NativeModules.CameraDevices as {
  getConstants: () => {
    availableCameraDevices: CameraDevice[]
    userPreferredCameraDevice: CameraDevice | undefined
  }
  getAvailableDeviceManually: () => Promise<CameraDevice[]>
}

const isAndroid = Platform.OS === 'android'

const constants = CameraDevicesManager.getConstants()
let devices = constants.availableCameraDevices

const DEVICES_CHANGED_NAME = 'CameraDevicesChanged'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventEmitter = new NativeEventEmitter(CameraDevicesManager as any)
eventEmitter.addListener(DEVICES_CHANGED_NAME, (newDevices: CameraDevice[]) => {
  devices = newDevices
})

// On Android, sometimes the devices are not ready when the module is initialized.
// So we try to fetch them again after a delay if none are available.
if (isAndroid) {
  if ((devices?.length || 0) === 0) {
    setTimeout(() => {
      CameraDevicesManager.getAvailableDeviceManually().then((newDevices) => {
        devices = newDevices
      })
    }, 5000)
  }
}

export const CameraDevices = {
  userPreferredCameraDevice: constants.userPreferredCameraDevice,
  getAvailableCameraDevices: () => devices,
  getAvailableCameraDevicesManually: async () => {
    if (isAndroid) {
      const newDevices = await CameraDevicesManager.getAvailableDeviceManually()
      if ((newDevices?.length || 0) > 0) {
        devices = newDevices
      }
      return newDevices
    }
    return Promise.resolve([])
  },
  addCameraDevicesChangedListener: (callback: (newDevices: CameraDevice[]) => void) => {
    return eventEmitter.addListener(DEVICES_CHANGED_NAME, callback)
  },
}
