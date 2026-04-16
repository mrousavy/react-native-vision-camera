import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraOutput } from 'react-native-vision-camera'
import type { Barcode } from './Barcode.nitro'
import type { TargetBarcodeFormat } from './BarcodeFormat'
import type { BarcodeScanner } from './BarcodeScanner.nitro'
import type { BarcodeScannerOutputResolution } from './BarcodeScannerOutputResolution'

export interface BarcodeScannerOptions {
  /**
   * Specifies the formats to be used for Barcode
   * scanning.
   *
   * If you want to detect all kinds of barcodes,
   * use {@linkcode TargetBarcodeFormat | ['all']}
   */
  barcodeFormats: TargetBarcodeFormat[]
}

export interface BarcodeScannerOutputOptions {
  /**
   * Specifies the formats to be used for Barcode
   * scanning.
   *
   * If you want to detect all kinds of barcodes,
   * use {@linkcode TargetBarcodeFormat | ['all']}
   */
  barcodeFormats: TargetBarcodeFormat[]
  /**
   * Controls which camera buffer resolution should be used.
   *
   * - `'preview'`: Prefer preview-sized buffers for lower latency.
   * - `'full'`: Prefer full/highest available buffers for better detail.
   *
   * @default 'preview'
   */
  outputResolution?: BarcodeScannerOutputResolution
  /**
   * Called whenever barcodes have been detected.
   */
  onBarcodeScanned: (barcodes: Barcode[]) => void
  /**
   * Called when there was an error detecting barcodes.
   */
  onError: (error: Error) => void
}

export interface BarcodeScannerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Create a new {@linkcode BarcodeScanner}.
   */
  createBarcodeScanner(options: BarcodeScannerOptions): BarcodeScanner

  // TODO: Nitro does not support external inheritance in Swift yet, so
  //       we cannot have a custom HybridObject that extends CameraOutput.
  //       Once Nitro supports this, we can return a concrete type here.
  /**
   * Create a new {@linkcode CameraOutput} that can
   * detect Barcodes.
   */
  createBarcodeScannerOutput(options: BarcodeScannerOutputOptions): CameraOutput
}
