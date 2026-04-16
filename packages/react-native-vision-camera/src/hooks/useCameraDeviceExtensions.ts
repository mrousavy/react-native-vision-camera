import { useEffect, useState } from 'react'
import { getSupportedExtensions } from '../CameraDevices'
import type { CameraDevice } from '../specs/inputs/CameraDevice.nitro'
import type { CameraExtension } from '../specs/inputs/CameraExtension.nitro'

/**
 * Get a list of all available {@linkcode CameraExtension}s for this specific
 * {@linkcode CameraDevice}.
 * @example
 * ```ts
 * const device = useCameraDevice('back')
 * const extensions = useCameraDeviceExtensions(device)
 * // ...enable extension if available
 * ```
 */
export function useCameraDeviceExtensions(
  device: CameraDevice | undefined,
): CameraExtension[] | undefined {
  const [extensions, setExtensions] = useState<CameraExtension[]>([])

  useEffect(() => {
    if (device == null) return
    const load = async () => {
      const exts = await getSupportedExtensions(device)
      setExtensions(exts)
    }
    load()
  }, [device])

  return extensions
}
