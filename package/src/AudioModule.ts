import { NativeModules } from 'react-native'

export type RingerMode = 'silent' | 'vibrate' | 'normal'

interface ModuleSpec {
  getRingerMode: () => RingerMode
  getConstants: () => {
    shouldPlayShutterSoundRegardless: boolean
  }
}

const AudioManager = NativeModules.Audio as ModuleSpec

const constants = AudioManager.getConstants()

export const Audio = {
  /**
   * Get the phone's current ringer mode.
   * - `'silent'`: The phone is completely silent. Audio should not be played.
   * - `'vibrate'`: The phone is only vibrating for important messages.
   * - `'normal'`: The phone is in normal ringer mode, audio can be played.
   */
  getRingerMode: (): RingerMode => {
    return AudioManager.getRingerMode()
  },
  /**
   * Whether the shutter sound should be played regardless of theh ringer mode -
   * such as in countries with regulations (e.g. Japan).
   */
  shouldPlayShutterSound: constants.shouldPlayShutterSoundRegardless,
}
