import type { HybridObject } from 'react-native-nitro-modules'
import type { Frame, PreviewViewMethods } from 'react-native-vision-camera'
import type { createTextRecognizer } from '../factory'
import type { useTextRecognizer } from '../useTextRecognizer'
import type { RecognizedText } from './RecognizedText'

/**
 * Represents a Text Recognizer that uses ML Kit Text Recognition.
 *
 * The {@linkcode TextRecognizer} can be used in a
 * Frame Processor by calling {@linkcode TextRecognizer.recognizeText | recognizeText(...)}.
 *
 * @see {@linkcode useTextRecognizer | useTextRecognizer(...)}
 * @see {@linkcode createTextRecognizer | createTextRecognizer(...)}
 */
export interface TextRecognizer
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Synchronously recognizes text in the
   * given {@linkcode Frame}.
   *
   * All coordinates in the {@linkcode RecognizedText} are
   * relative to the {@linkcode Frame}'s coordinate system.
   *
   * You can convert text coordinates to Camera coordinates using
   * {@linkcode Frame.convertFramePointToCameraPoint | Frame.convertFramePointToCameraPoint(...)},
   * and then convert the Camera coordinates to Preview View coordinates using
   * {@linkcode PreviewViewMethods.convertCameraPointToViewPoint | PreviewViewMethods.convertCameraPointToViewPoint(...)}.
   *
   * @example
   * ```ts
   * const recognizer = // ...
   * const frame = // ...
   * const previewView = // ...
   *
   * const result = recognizer.recognizeText(frame)
   * for (const block of result.blocks) {
   *   console.log('Recognized text:', block.text)
   *   for (const point of block.cornerPoints) {
   *     const cameraPoint = frame.convertFramePointToCameraPoint(point)
   *     const previewPoint = previewView.convertCameraPointToViewPoint(cameraPoint)
   *     console.log('Corner Point:', previewPoint)
   *   }
   * }
   * ```
   */
  recognizeText(frame: Frame): RecognizedText
  /**
   * Asynchronously recognizes text in the
   * given {@linkcode Frame}.
   *
   * @see {@linkcode recognizeText}
   */
  recognizeTextAsync(frame: Frame): Promise<RecognizedText>
}
