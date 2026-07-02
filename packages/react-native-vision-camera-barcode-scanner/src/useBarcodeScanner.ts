import { useMemo } from 'react'
import type { Image } from 'react-native-nitro-image'
import type { Frame } from 'react-native-vision-camera'
import { createBarcodeScanner } from './factory'
import type { Barcode } from './specs/Barcode.nitro'
import type { BarcodeScanner } from './specs/BarcodeScanner.nitro'
import type { BarcodeScannerOptions } from './specs/BarcodeScannerFactory.nitro'

/**
 * Use a {@linkcode BarcodeScanner}.
 *
 * A {@linkcode BarcodeScanner} can be used to detect
 * {@linkcode Barcode}s in a {@linkcode Frame} in a Frame
 * Processor, or in an existing {@linkcode Image}.
 *
 * @example
 * ```ts
 * const barcodeScanner = useBarcodeScanner({ barcodeFormats: ['all-formats'] })
 * const frameOutput = useFrameOutput({
 *   onFrame(frame) {
 *     'worklet'
 *     const barcodes = barcodeScanner.scanCodes(frame)
 *     console.log(`Detected ${barcodes.length} barcodes!`)
 *     frame.dispose()
 *   }
 * })
 * ```
 */
export function useBarcodeScanner({
  barcodeFormats,
}: BarcodeScannerOptions): BarcodeScanner {
  return useMemo(
    () => createBarcodeScanner({ barcodeFormats: barcodeFormats }),
    [barcodeFormats],
  )
}
