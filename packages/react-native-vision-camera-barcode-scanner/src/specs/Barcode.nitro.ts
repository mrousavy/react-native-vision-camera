import type { HybridObject } from 'react-native-nitro-modules'
import type { Frame } from 'react-native-vision-camera'
import type { createBarcodeScannerOutput } from '../factory'
import type { BarcodeFormat } from './BarcodeFormat'
import type { BarcodeScanner } from './BarcodeScanner.nitro'
import type { BarcodeValueType } from './BarcodeValueType'
import type { Point } from './Point'
import type { Rect } from './Rect'

/**
 * Represents a single detected Barcode.
 *
 * A {@linkcode Barcode} is produced via the
 * {@linkcode BarcodeScanner} or the Barcode Scanner
 * {@linkcode createBarcodeScannerOutput | CameraOutput}.
 *
 * See {@linkcode BarcodeScanner.scanCodes | BarcodeScanner.scanCodes(...)}
 * for information about converting Barcode coordinates to
 * view coordinates.
 *
 * @example
 * ```ts
 * const barcode = ...
 * console.log(`Barcode value: ${barcode.rawValue}`)
 * ```
 */
export interface Barcode
  extends HybridObject<{
    ios: 'swift'
    android: 'kotlin'
  }> {
  /**
   * Get the format of this {@linkcode Barcode}.
   * @see {@linkcode BarcodeFormat}
   */
  readonly format: BarcodeFormat

  /**
   * Get the {@linkcode Barcode}'s bounding box, relative
   * to the input {@linkcode Frame}'s coordinates.
   */
  readonly boundingBox: Rect
  /**
   * Get the {@linkcode Barcode}'s corner points, relative
   * to the input {@linkcode Frame}'s coordinates.
   */
  readonly cornerPoints: Point[]
  /**
   * Get the {@linkcode Barcode}'s value in a user-friendly format.
   */
  readonly displayValue: string | undefined
  /**
   * Get the {@linkcode Barcode}'s value in raw bytes.
   */
  readonly rawBytes: ArrayBuffer | undefined
  /**
   * Get the {@linkcode Barcode}'s raw value as a string.
   */
  readonly rawValue: string | undefined
  /**
   * Get the {@linkcode Barcode}'s value's type.
   * @see {@linkcode BarcodeValueType}
   */
  readonly valueType: BarcodeValueType
}
