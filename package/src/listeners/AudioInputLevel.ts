import { NativeModules, NativeEventEmitter } from 'react-native'

type AudioInputLevelManagerType = {
  setPreferredAudioInputDevice: (uid: string | null | undefined) => void
}

const AudioInputLevelManager = NativeModules.AudioInputLevelManager as unknown as AudioInputLevelManagerType
const AUDIO_LEVEL_CHANGED_NAME = 'AudioInputLevelChanged'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventEmitter = new NativeEventEmitter(NativeModules.AudioInputLevelManager as any)

export const AudioInputLevel = {
  /**
   * Set the preferred audio input device for level monitoring by its UID.
   * Pass null/undefined to reset to system default routing.
   */
  setPreferredAudioInputDevice: (uid: string | null | undefined) => {
    AudioInputLevelManager.setPreferredAudioInputDevice(uid ?? null)
  },
  /**
   * Listen to audio level changes (in dBFS). Returns a subscription.
   */
  addAudioLevelChangedListener: (callback: (level: number) => void) => {
    return eventEmitter.addListener(AUDIO_LEVEL_CHANGED_NAME, callback)
  },
}
