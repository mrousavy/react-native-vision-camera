import type { useObjectOutput } from '../../hooks/useObjectOutput'
import type {
  ScannedCode,
  ScannedFace,
  ScannedObject,
  ScannedObjectType,
} from '../instances/ScannedObject.nitro'
import type { CameraOutput } from './CameraOutput.nitro'

/**
 * Options for the {@linkcode CameraObjectOutput}.
 * @see {@linkcode ObjectOutputOptions}
 * @see {@linkcode useObjectOutput | useObjectOutput(...)}
 * @platform iOS
 */
export interface ObjectOutputOptions {
  /**
   * The array of {@linkcode ScannedObjectType}s to
   * detect.
   */
  enabledObjectTypes: ScannedObjectType[]
}

/**
 * The {@linkcode CameraObjectOutput} allows scanning various
 * objects ({@linkcode ScannedObject}), faces ({@linkcode ScannedFace}),
 * or machine-readable codes ({@linkcode ScannedCode}) in the Camera, using
 * a platform-native detection algorithm.
 *
 * @see {@linkcode ObjectOutputOptions}
 * @see {@linkcode useObjectOutput | useObjectOutput(...)}
 * @platform iOS
 * @example
 * ```ts
 * const objectOutput = useObjectOutput({
 *   types: ['qr-code'],
 *   onObjectsScanned(objects) {
 *     console.log(`Scanned ${objects.length} objects!`)
 *   }
 * })
 * ```
 */
export interface CameraObjectOutput extends CameraOutput {
  /**
   * Sets the {@linkcode onObjectsScanned} callback.
   */
  setOnObjectsScannedCallback(
    onObjectsScanned: ((objects: ScannedObject[]) => void) | undefined,
  ): void
}
