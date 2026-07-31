import type { CameraDeviceFactory } from '../../specs/inputs/CameraDeviceFactory.nitro'
import { VisionCamera } from '../../VisionCamera'
import { createPromiseHook } from './createPromiseHook'

/**
 * Asynchronously use a {@linkcode CameraDeviceFactory}
 */
export const useCameraDeviceFactory = createPromiseHook(() =>
  VisionCamera.createDeviceFactory(),
)
