import { NitroModules } from 'react-native-nitro-modules'
import type {
  CameraOutput,
  CameraSession,
  Frame,
} from 'react-native-vision-camera'
import type { Barcode } from './specs/Barcode.nitro'
import type { BarcodeScanner } from './specs/BarcodeScanner.nitro'
import type {
  BarcodeScannerFactory,
  BarcodeScannerOptions,
  BarcodeScannerOutputOptions,
} from './specs/BarcodeScannerFactory.nitro'

const factory = NitroModules.createHybridObject<BarcodeScannerFactory>(
  'BarcodeScannerFactory',
)

/**
 * Create a new {@linkcode BarcodeScanner}.
 *
 * The {@linkcode BarcodeScanner} can be used to
 * scan {@linkcode Barcode}s in a {@linkcode Frame}.
 */
export function createBarcodeScanner(
  options: BarcodeScannerOptions,
): BarcodeScanner {
  return factory.createBarcodeScanner(options)
}

/**
 * Create a new Barcode Scanner {@linkcode CameraOutput}.
 *
 * The Barcode Scanner {@linkcode CameraOutput} can be
 * attached to a {@linkcode CameraSession}.
 */
export function createBarcodeScannerOutput(
  options: BarcodeScannerOutputOptions,
): CameraOutput {
  return factory.createBarcodeScannerOutput(options)
}
