import { useMemo } from 'react'
import type { Frame } from 'react-native-vision-camera'
import { createTextRecognizer } from './factory'
import type { TextRecognizer } from './specs/TextRecognizer.nitro'

/**
 * Use a {@linkcode TextRecognizer}.
 *
 * A {@linkcode TextRecognizer} can be used to recognize
 * text in a {@linkcode Frame} in a Frame
 * Processor.
 *
 * @example
 * ```ts
 * const textRecognizer = useTextRecognizer()
 * const frameOutput = useFrameOutput({
 *   onFrame(frame) {
 *     'worklet'
 *     const result = textRecognizer.recognizeText(frame)
 *     console.log(`Recognized text: ${result.text}`)
 *     frame.dispose()
 *   }
 * })
 * ```
 */
export function useTextRecognizer(): TextRecognizer {
  return useMemo(() => createTextRecognizer(), [])
}
