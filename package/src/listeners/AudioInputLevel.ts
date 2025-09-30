import { NativeModules, NativeEventEmitter } from 'react-native'

type AudioInputLevelManagerType = {
  setPreferredAudioInputDevice: (uid: string | null) => void
}

const AudioInputLevelManager = NativeModules.AudioInputLevelManager as AudioInputLevelManagerType
const AUDIO_LEVEL_CHANGED_NAME = 'AudioInputLevelChanged'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventEmitter = new NativeEventEmitter(NativeModules.AudioInputLevelManager as any)

export const AudioInputLevel = {
  /**
   * Set the input you want to listen to audio levels for
   * Pass undefined to reset to system default routing.
   *
   * @platform Android
   */
  setPreferredAudioInputDevice: (uid: string | null) => {
    AudioInputLevelManager.setPreferredAudioInputDevice(uid)
  },
  /**
   * Listen to audio level changes.
   */
  addAudioLevelChangedListener: (callback: (level: number) => void) => {
    return eventEmitter.addListener(AUDIO_LEVEL_CHANGED_NAME, callback)
  },
}
