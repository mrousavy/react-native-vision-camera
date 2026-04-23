import { useMemo } from 'react'
import type { CameraPreviewOutput } from '../specs/outputs/CameraPreviewOutput.nitro'
import type { CameraSession } from '../specs/session/CameraSession.nitro'
import { VisionCamera } from '../VisionCamera'

/**
 * Use a {@linkcode CameraPreviewOutput} for rendering the Camera's live
 * preview on screen.
 *
 * The returned {@linkcode CameraPreviewOutput} can be connected to a
 * {@linkcode CameraSession} and then displayed using the `PreviewView`.
 *
 * @example
 * ```ts
 * const previewOutput = usePreviewOutput()
 * ```
 */
export function usePreviewOutput(): CameraPreviewOutput {
  return useMemo(() => VisionCamera.createPreviewOutput(), [])
}
