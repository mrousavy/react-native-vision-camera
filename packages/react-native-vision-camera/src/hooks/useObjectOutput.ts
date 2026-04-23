import { useEffect, useMemo } from 'react'
import type { CameraObjectOutput, ScannedObject, ScannedObjectType } from '..'
import { VisionCamera } from '../VisionCamera'

interface Props {
  /**
   * The types of objects that the {@linkcode CameraObjectOutput} should scan for.
   *
   * Use `['all']` to scan for all supported object types.
   */
  types: ScannedObjectType[]
  /**
   * A callback that will be called every time the {@linkcode CameraObjectOutput}
   * has scanned one or more objects.
   *
   * @see {@linkcode ScannedObject}
   */
  onObjectsScanned?: (objects: ScannedObject[]) => void
}

/**
 * Use a {@linkcode CameraObjectOutput}.
 *
 * @example
 * ```ts
 * const objectOutput = useObjectOutput({
 *   types: ['all'],
 *   onObjectsScanned(objects) {
 *     console.log(`Scanned ${objects.length} objects!`)
 *   }
 * })
 * ```
 */
export function useObjectOutput({
  types,
  onObjectsScanned,
}: Props): CameraObjectOutput {
  // 1. Create object output
  const objectOutput = useMemo(
    () =>
      VisionCamera.createObjectOutput({
        enabledObjectTypes: types,
      }),
    [types],
  )
  // 2. Update onObjectsScanned() callback if it changed
  useEffect(() => {
    objectOutput.setOnObjectsScannedCallback(onObjectsScanned)
  }, [objectOutput, onObjectsScanned])

  // 3. Return :)
  return objectOutput
}
