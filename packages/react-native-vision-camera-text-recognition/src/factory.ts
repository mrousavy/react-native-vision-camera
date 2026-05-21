import { NitroModules } from 'react-native-nitro-modules'
import type { CameraOutput, Frame } from 'react-native-vision-camera'
import type {
  TextRecognitionOutputOptions,
  TextRecognizerFactory,
} from './specs/TextRecognizerFactory.nitro'
import type { TextRecognizer } from './specs/TextRecognizer.nitro'

const factory = NitroModules.createHybridObject<TextRecognizerFactory>(
  'TextRecognizerFactory',
)

/**
 * Create a new {@linkcode TextRecognizer}.
 *
 * The {@linkcode TextRecognizer} can be used to
 * recognize text in a Camera {@linkcode Frame}.
 */
export function createTextRecognizer(): TextRecognizer {
  return factory.createTextRecognizer()
}

/**
 * Create a new Text Recognition {@linkcode CameraOutput}.
 *
 * The Text Recognition {@linkcode CameraOutput} can be
 * attached to a Camera or Camera Session.
 */
export function createTextRecognitionOutput(
  options: TextRecognitionOutputOptions,
): CameraOutput {
  return factory.createTextRecognitionOutput(options)
}
