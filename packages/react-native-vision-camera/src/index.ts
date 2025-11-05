import { NitroModules } from 'react-native-nitro-modules'
import { type CameraFactory } from './specs/CameraFactory.nitro'
import { type WorkletQueueFactory } from './specs/frame-processors/WorkletQueueFactory.nitro'

export const HybridCameraFactory =
  NitroModules.createHybridObject<CameraFactory>('CameraFactory')

export const HybridWorkletQueueFactory =
  NitroModules.createHybridObject<WorkletQueueFactory>('WorkletQueueFactory')

export * from './hooks/useCameraDevices'

export * from './PreviewView'
