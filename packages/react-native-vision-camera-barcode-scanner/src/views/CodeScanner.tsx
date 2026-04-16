// biome-ignore lint/style/useImportType: React is used for JSX.
import React from 'react'
import type { ViewProps } from 'react-native'
import {
  Camera,
  type CameraDevice,
  type Frame,
  useCameraDevice,
} from 'react-native-vision-camera'
import type { Barcode } from '../specs/Barcode.nitro'
import type { BarcodeScannerOutputOptions } from '../specs/BarcodeScannerFactory.nitro'
import { useBarcodeScanner } from '../useBarcodeScanner'
import { useBarcodeScannerOutput } from '../useBarcodeScannerOutput'

export interface CodeScannerOptions extends BarcodeScannerOutputOptions {
  /**
   * Sets the style for this view.
   * Most commonly, you would use `{ flex: 1 }`.
   */
  style: ViewProps['style']
  /**
   * Whether the {@linkcode CodeScanner} is active,
   * or not.
   *
   * You can toggle {@linkcode isActive} to pause/resume
   * the Camera if the app becomes inactive, or the user
   * to a different screen.
   */
  isActive: boolean
}

/**
 * A view that detects {@linkcode Barcode}s in a Camera
 * using the default rear {@linkcode CameraDevice}.
 *
 * @discussion
 * All {@linkcode Barcode} coordinates are in the {@linkcode Frame}'s
 * coordinate system. If you need to convert {@linkcode Barcode}
 * coordinates to view coordinates, either use
 * {@linkcode useBarcodeScannerOutput | useBarcodeScannerOutput(...)}
 * or {@linkcode useBarcodeScanner | useBarcodeScanner(...)} directly,
 * and convert coordinates using your Preview View yourself.
 *
 * See {@linkcode BarcodeScanner.scanCodes | scanCodes(...)} for more
 * information about coordinate system conversions.
 *
 * @example
 * ```tsx
 * function App() {
 *   const isFocused = useIsFocused()
 *   const appState = useAppState()
 *   const isActive = isFocused && appState === 'active'
 *   return (
 *     <CodeScanner
 *       isActive={isActive}
 *       barcodeFormats={['all']}
 *       onBarcodeScanned={(barcodes) => {
 *         console.log(`Scanned ${barcodes.length} barcodes!`)
 *       }}
 *       onError={(error) => {
 *         console.error(`Error scanning barcodes:`, error)
 *       }}
 *     />
 *   )
 * }
 * ```
 */
export function CodeScanner({
  isActive,
  style,
  ...barcodeScannerOptions
}: CodeScannerOptions): React.ReactElement {
  const device = useCameraDevice('back')
  const output = useBarcodeScannerOutput(barcodeScannerOptions)

  if (device == null) {
    throw new Error(`No Camera device available!`)
  }
  return (
    <Camera
      style={style}
      isActive={isActive}
      device={device}
      outputs={[output]}
      onError={barcodeScannerOptions.onError}
    />
  )
}
