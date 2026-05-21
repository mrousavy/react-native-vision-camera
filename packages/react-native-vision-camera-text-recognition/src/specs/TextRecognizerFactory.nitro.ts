import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraOutput } from 'react-native-vision-camera'
import type { RecognizedText } from './RecognizedText'
import type { TextRecognitionOutputResolution } from './TextRecognitionOutputResolution'
import type { TextRecognizer } from './TextRecognizer.nitro'

export interface TextRecognitionOutputOptions {
  /**
   * Controls which camera buffer resolution should be used.
   *
   * - `'preview'`: Prefer preview-sized buffers for lower latency.
   * - `'full'`: Prefer full/highest available buffers for better detail.
   *
   * @default 'preview'
   */
  outputResolution?: TextRecognitionOutputResolution
  /**
   * Called whenever text has been recognized.
   */
  onTextRecognized: (result: RecognizedText) => void
  /**
   * Called when there was an error recognizing text.
   */
  onError: (error: Error) => void
}

export interface TextRecognizerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Create a new {@linkcode TextRecognizer}.
   */
  createTextRecognizer(): TextRecognizer

  // TODO: Nitro does not support external inheritance in Swift yet, so
  //       we cannot have a custom HybridObject that extends CameraOutput.
  //       Once Nitro supports this, we can return a concrete type here.
  /**
   * Create a new {@linkcode CameraOutput} that can
   * recognize text.
   */
  createTextRecognitionOutput(options: TextRecognitionOutputOptions): CameraOutput
}
