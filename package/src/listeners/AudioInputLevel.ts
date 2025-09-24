// import { NativeModules, NativeEventEmitter } from 'react-native'

// interface AudioInputLevelManagerType {}

// const AudioInputLevelManager = NativeModules.AudioInputLevel as AudioInputLevelManagerType
// const AUDIO_LEVEL_CHANGED_NAME = 'AudioInputLevelChanged'
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const eventEmitter = new NativeEventEmitter(AudioInputLevelManager as any)

// export const AudioInputLevel = {
//   /**
//    * Used for listening to audio levels of the current microphone.
//    */
//   addAudioLevelChangedListener: (callback: (level: number) => void) => {
//     return eventEmitter.addListener(AUDIO_LEVEL_CHANGED_NAME, callback)
//   },
// }
