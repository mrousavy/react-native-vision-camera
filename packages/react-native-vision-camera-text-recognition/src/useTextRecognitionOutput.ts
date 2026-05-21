import { useMemo, useRef } from 'react'
import type { CameraOutput } from 'react-native-vision-camera'
import { createTextRecognitionOutput } from './factory'
import type { TextRecognitionOutputOptions } from './specs/TextRecognizerFactory.nitro'

/**
 * Use a Text Recognition {@linkcode CameraOutput}.
 *
 * The Text Recognition {@linkcode CameraOutput} can be
 * attached to a Camera Session or Camera
 * component.
 *
 * @example
 * Attach to a `<Camera />` component:
 * ```tsx
 * const device = ...
 * const textOutput = useTextRecognitionOutput({
 *   onTextRecognized(result) {
 *     console.log(`Recognized text: ${result.text}`)
 *   },
 *   onError(error) {
 *     console.error(`Failed to recognize text!`, error)
 *   }
 * })
 *
 * return (
 *   <Camera
 *     isActive={true}
 *     device={device}
 *     outputs={[textOutput]}
 *   />
 * )
 * ```
 * @example
 * Attach to a `CameraSession`:
 * ```ts
 * const device = ...
 * const textOutput = useTextRecognitionOutput({
 *   onTextRecognized(result) {
 *     console.log(`Recognized text: ${result.text}`)
 *   },
 *   onError(error) {
 *     console.error(`Failed to recognize text!`, error)
 *   }
 * })
 * const camera = useCamera({
 *   isActive: true,
 *   device: device,
 *   outputs: [textOutput]
 * })
 * ```
 */
export function useTextRecognitionOutput({
  outputResolution = 'preview',
  onTextRecognized,
  onError,
}: TextRecognitionOutputOptions): CameraOutput {
  const stableOnTextRecognized = useRef(onTextRecognized)
  stableOnTextRecognized.current = onTextRecognized

  const stableOnError = useRef(onError)
  stableOnError.current = onError

  return useMemo(
    () =>
      createTextRecognitionOutput({
        outputResolution: outputResolution,
        onTextRecognized(result) {
          stableOnTextRecognized.current(result)
        },
        onError(error) {
          stableOnError.current(error)
        },
      }),
    [outputResolution],
  )
}
