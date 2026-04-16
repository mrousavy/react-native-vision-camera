import { useMemo, useRef } from 'react'
import type {
  Camera,
  CameraOutput,
  CameraSession,
} from 'react-native-vision-camera'
import { createBarcodeScannerOutput } from './factory'
import type { BarcodeScannerOutputOptions } from './specs/BarcodeScannerFactory.nitro'

/**
 * Use a Barcode Scanner {@linkcode CameraOutput}.
 *
 * The Barcode Scanner {@linkcode CameraOutput} can be
 * attached to a {@linkcode CameraSession} or {@linkcode Camera}
 * component.
 *
 * @example
 * Attach to a `<Camera />` component:
 * ```tsx
 * const device = ...
 * const scannerOutput = useBarcodeScannerOutput({
 *   barcodeFormats: ['all'],
 *   onBarcodeScanned(barcodes) {
 *     console.log(`Scanned ${barcodes.length} barcodes!`)
 *   },
 *   onError(error) {
 *     console.error(`Failed to scan barcodes!`, error)
 *   }
 * })
 *
 * return (
 *   <Camera
 *     isActive={true}
 *     device={device}
 *     outputs={[scannerOutput]}
 *   />
 * )
 * ```
 * @example
 * Attach to a `CameraSession`:
 * ```ts
 * const device = ...
 * const scannerOutput = useBarcodeScannerOutput({
 *   barcodeFormats: ['all'],
 *   onBarcodeScanned(barcodes) {
 *     console.log(`Scanned ${barcodes.length} barcodes!`)
 *   },
 *   onError(error) {
 *     console.error(`Failed to scan barcodes!`, error)
 *   }
 * })
 * const camera = useCamera({
 *   isActive: true,
 *   device: device,
 *   outputs: [scannerOutput]
 * })
 * ```
 */
export function useBarcodeScannerOutput({
  barcodeFormats,
  outputResolution = 'preview',
  onBarcodeScanned,
  onError,
}: BarcodeScannerOutputOptions): CameraOutput {
  const stableOnBarcodeScanned = useRef(onBarcodeScanned)
  stableOnBarcodeScanned.current = onBarcodeScanned

  const stableOnError = useRef(onError)
  stableOnError.current = onError

  return useMemo(
    () =>
      createBarcodeScannerOutput({
        barcodeFormats: barcodeFormats,
        outputResolution: outputResolution,
        onBarcodeScanned(barcodes) {
          stableOnBarcodeScanned.current(barcodes)
        },
        onError(error) {
          stableOnError.current(error)
        },
      }),
    [barcodeFormats, outputResolution],
  )
}
