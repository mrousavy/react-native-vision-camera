import { NativeModules, NativeEventEmitter } from 'react-native'
import type { AudioInputDevice } from './types/AudioInputDevice'

const AudioInputDevicesManager = NativeModules.AudioInputDevices as {
  getConstants: () => {
    availableAudioInputDevices: AudioInputDevice[]
  }
}

const constants = AudioInputDevicesManager.getConstants()

const DEVICES_CHANGED_NAME = 'AudioInputDevicesChanged'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventEmitter = new NativeEventEmitter(AudioInputDevicesManager as any)

export const AudioInputDevices = {
  // userPreferredCameraDevice: constants.userPreferredCameraDevice,
  getAvailableAudioInputDevices: () => constants.availableAudioInputDevices,
  addAudioInputChangedListener: (callback: (newDevices: AudioInputDevice[]) => void) => {
    return eventEmitter.addListener(DEVICES_CHANGED_NAME, callback)
  },
}
