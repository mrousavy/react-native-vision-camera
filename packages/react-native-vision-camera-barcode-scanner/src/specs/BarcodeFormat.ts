import type { Barcode } from './Barcode.nitro'
import type { BarcodeScanner } from './BarcodeScanner.nitro'

/**
 * Represents a detected {@linkcode Barcode}'s format, or
 * `'unknown'` if the format of a scanned Barcode could not be
 * determined.
 */
export type BarcodeFormat =
  | 'unknown'
  | 'code-128'
  | 'code-39'
  | 'code-93'
  | 'codabar'
  | 'data-matrix'
  | 'ean-13'
  | 'ean-8'
  | 'itf'
  | 'qr-code'
  | 'upc-a'
  | 'upc-e'
  | 'pdf-417'
  | 'aztec'

/**
 * Represents a target {@linkcode BarcodeFormat} that the {@linkcode BarcodeScanner}
 * can be configured to scan for, or `'all-formats'` to scan for every supported format.
 */
export type TargetBarcodeFormat =
  | Exclude<BarcodeFormat, 'unknown'>
  | 'all-formats'
