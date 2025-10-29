import type { CameraSessionOutput } from './CameraSessionOutput.nitro'

export interface CameraSessionPhotoOutput extends CameraSessionOutput {
  capturePhoto(): Promise<void>
}
