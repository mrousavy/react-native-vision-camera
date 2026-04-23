import type { HybridObject } from 'react-native-nitro-modules'
import type { Frame, PreviewViewMethods } from 'react-native-vision-camera'
import type { createBarcodeScanner } from '../factory'
import type { useBarcodeScanner } from '../useBarcodeScanner'
import type { Barcode } from './Barcode.nitro'

/**
 * Represents a Barcode Scanner that uses MLKit Barcodes.
 *
 * The {@linkcode BarcodeScanner} can be used in a
 * Frame Processor by calling {@linkcode BarcodeScanner.scanCodes | scanCodes(...)}.
 *
 * @see {@linkcode useBarcodeScanner | useBarcodeScanner(...)}
 * @see {@linkcode createBarcodeScanner | createBarcodeScanner(...)}
 */
export interface BarcodeScanner
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Synchronously detects {@linkcode Barcode}s in the
   * given {@linkcode Frame}.
   *
   * All coordinates in the {@linkcode Barcode} are
   * relative to the {@linkcode Frame}'s coordinate system.
   *
   * You can convert {@linkcode Barcode} coordinates to Camera coordinates using
   * {@linkcode Frame.convertFramePointToCameraPoint | Frame.convertFramePointToCameraPoint(...)},
   * and then convert the Camera coordinates to Preview View coordinates using
   * {@linkcode PreviewViewMethods.convertCameraPointToViewPoint | PreviewViewMethods.convertCameraPointToViewPoint(...)}.
   *
   * @example
   * ```ts
   * const scanner = // ...
   * const frame = // ...
   * const previewView = // ...
   *
   * const barcodes = scanner.scanCodes(frame)
   * for (const barcode of barcodes) {
   *   console.log('Barcode value:', barcode.rawValue)
   *   for (const point of barcode.cornerPoints) {
   *     const cameraPoint = frame.convertFramePointToCameraPoint(point)
   *     const previewPoint = previewView.convertCameraPointToViewPoint(cameraPoint)
   *     console.log('Corner Point:', previewPoint)
   *   }
   * }
   * ```
   */
  scanCodes(frame: Frame): Barcode[]
  /**
   * Asynchronously detects {@linkcode Barcode}s in the
   * given {@linkcode Frame}.
   *
   * @see {@linkcode scanCodes}
   */
  scanCodesAsync(frame: Frame): Promise<Barcode[]>
}
