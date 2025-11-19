import type { ThumbnailFile } from 'react-native-vision-camera'

export type Routes = {
  PermissionsPage: undefined
  CameraPage: undefined
  CodeScannerPage: undefined
  MediaPage: {
    path: string
    type: 'video' | 'photo'
    thumbnail: ThumbnailFile | null
  }
  Devices: undefined
}
