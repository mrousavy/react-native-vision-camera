// biome-ignore lint/style/useImportType: React is used for JSX.
import React from 'react'
import type { ViewProps } from 'react-native'
import { Camera, useCameraDevice } from 'react-native-vision-camera'
import type { CameraDevice, Frame } from 'react-native-vision-camera'
import type { TextRecognitionOutputOptions } from '../specs/TextRecognizerFactory.nitro'
import { useTextRecognitionOutput } from '../useTextRecognitionOutput'

export interface TextRecognitionCameraOptions
  extends TextRecognitionOutputOptions {
  /**
   * Sets the style for this view.
   * Most commonly, you would use `{ flex: 1 }`.
   */
  style: ViewProps['style']
  /**
   * Whether the {@linkcode TextRecognitionCamera} is active,
   * or not.
   *
   * You can toggle {@linkcode isActive} to pause/resume the Camera if the app
   * becomes inactive, or the user navigates to a different screen.
   */
  isActive: boolean
}

/**
 * A view that recognizes text in a Camera
 * using the default rear {@linkcode CameraDevice}.
 *
 * @discussion
 * All text coordinates are in the {@linkcode Frame}'s
 * coordinate system. If you need to convert text
 * coordinates to view coordinates, either use
 * {@linkcode useTextRecognitionOutput | useTextRecognitionOutput(...)}
 * or {@linkcode useTextRecognizer | useTextRecognizer(...)} directly,
 * and convert coordinates using your Preview View yourself.
 *
 * See {@linkcode TextRecognizer.recognizeText | recognizeText(...)} for more
 * information about coordinate system conversions.
 *
 * @example
 * ```tsx
 * function App() {
 *   const isFocused = useIsFocused()
 *   const appState = useAppState()
 *   const isActive = isFocused && appState === 'active'
 *   return (
 *     <TextRecognitionCamera
 *       isActive={isActive}
 *       onTextRecognized={(result) => {
 *         console.log(`Recognized text: ${result.text}`)
 *       }}
 *       onError={(error) => {
 *         console.error(`Error recognizing text:`, error)
 *       }}
 *     />
 *   )
 * }
 * ```
 */
export function TextRecognitionCamera({
  isActive,
  style,
  ...textRecognitionOptions
}: TextRecognitionCameraOptions): React.ReactElement {
  const device = useCameraDevice('back')
  const output = useTextRecognitionOutput(textRecognitionOptions)

  if (device == null) {
    throw new Error(`No Camera device available!`)
  }
  return (
    <Camera
      style={style}
      isActive={isActive}
      device={device}
      outputs={[output]}
      onError={textRecognitionOptions.onError}
    />
  )
}
