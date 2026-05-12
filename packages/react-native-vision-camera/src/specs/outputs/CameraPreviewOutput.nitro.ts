import type { CameraSession } from '../session/CameraSession.nitro'
import type { PreviewView } from '../views/PreviewView.nitro'
import type { CameraOutput } from './CameraOutput.nitro'

/**
 * Represents the {@linkcode CameraOutput} for preview.
 *
 * The {@linkcode CameraPreviewOutput} needs to be connected
 * to the {@linkcode CameraSession} as an output, as well
 * as to a {@linkcode PreviewView} as a target.
 *
 * @example
 * Creating a {@linkcode CameraPreviewOutput} via the Hooks API:
 * ```ts
 * const previewOutput = usePreviewOutput()
 * ```
 *
 * @example
 * Creating a {@linkcode CameraPreviewOutput} via the Imperative API:
 * ```ts
 * const previewOutput = VisionCamera.createPreviewOutput()
 * ```
 */
export interface CameraPreviewOutput extends CameraOutput {}
