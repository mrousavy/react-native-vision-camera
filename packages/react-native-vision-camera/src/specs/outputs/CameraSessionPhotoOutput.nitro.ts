import type { Image } from 'react-native-nitro-image'
import type { CameraSessionOutput } from './CameraSessionOutput.nitro'

interface CapturePhotoCallbacks {
  onWillBeginCapture?: () => void
  onWillCapturePhoto?: () => void
  onDidCapturePhoto?: () => void
  onDidFinishCapture?: () => void
}

export interface CameraSessionPhotoOutput extends CameraSessionOutput {
  capturePhoto(callbacks?: CapturePhotoCallbacks): Promise<Image>
}
