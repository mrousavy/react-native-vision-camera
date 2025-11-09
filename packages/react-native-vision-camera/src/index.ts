import { NitroModules } from 'react-native-nitro-modules'
import { type CameraFactory } from './specs/CameraFactory.nitro'
import { type WorkletQueueFactory } from './specs/frame-processors/WorkletQueueFactory.nitro'

export const HybridCameraFactory =
  NitroModules.createHybridObject<CameraFactory>('CameraFactory')

export const HybridWorkletQueueFactory =
  NitroModules.createHybridObject<WorkletQueueFactory>('WorkletQueueFactory')

export * from './hooks/useCameraDevices'

export * from './PreviewView'

export * from './specs/common-types/AutoFocusSystem'
export * from './specs/common-types/CameraPosition'
export * from './specs/common-types/ColorSpace'
export * from './specs/common-types/DeviceType'
export * from './specs/common-types/ExposureMode'
export * from './specs/common-types/FocusMode'
export * from './specs/common-types/ListenerSubscription'
export * from './specs/common-types/Orientation'
export * from './specs/common-types/PixelFormat'
export * from './specs/common-types/Point'
export * from './specs/common-types/Range'
export * from './specs/common-types/Rect'
export * from './specs/common-types/Resolution'
export * from './specs/common-types/Size'
export * from './specs/common-types/TargetPixelFormat'
export * from './specs/common-types/TorchMode'
export * from './specs/common-types/VideoStabilizationMode'
export * from './specs/common-types/WhiteBalanceGains'
export * from './specs/common-types/WhiteBalanceMode'

export * from './specs/frame-processors/NativeThread.nitro'
export * from './specs/frame-processors/WorkletQueueFactory.nitro'

export * from './specs/inputs/CameraDevice.nitro'
export * from './specs/inputs/CameraDeviceFactory.nitro'

export * from './specs/outputs/CameraOutput.nitro'
export * from './specs/outputs/CameraSessionFrameOutput.nitro'
export * from './specs/outputs/CameraSessionPhotoOutput.nitro'
export * from './specs/outputs/CameraSessionPreviewOutput.nitro'

export * from './specs/CameraDeviceController.nitro'
export * from './specs/CameraFactory.nitro'
export * from './specs/CameraFormat.nitro'
export * from './specs/CameraSession.nitro'
export * from './specs/Frame.nitro'
export * from './specs/Photo.nitro'
export * from './specs/PreviewView.nitro'
