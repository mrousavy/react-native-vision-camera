/* eslint-disable @typescript-eslint/ban-types */
import type { HostComponent, ViewProps } from 'react-native'
import type { DirectEventHandler, Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

export type VisionCameraComponentType = HostComponent<NativeProps>

export interface NativeProps extends ViewProps {
  isActive: boolean
  preview?: boolean
  photo?: boolean
  video?: boolean
  audio?: boolean
  pixelFormat?: 'yuv' | 'rgb'
  enableLocation?: boolean
  torch?: 'off' | 'on'
  zoom?: Double
  enableZoomGesture?: boolean
  exposure?: Double
  format?: Readonly<{
    photoHeight: Double
    photoWidth: Double
    videoHeight: Double
    videoWidth: Double
    maxISO: Double
    minISO: Double
    fieldOfView: Double
    supportsVideoHDR: boolean
    supportsPhotoHDR: boolean
    supportsDepthCapture: boolean
    minFps: Double
    maxFps: Double
    autoFocusSystem: string
    videoStabilizationModes: string[]
  }>
  resizeMode?: 'cover' | 'contain'
  androidPreviewViewType?: 'surface-view' | 'texture-view'
  fps?: Double
  videoHdr?: boolean // not sure why was int on native side
  photoHdr?: boolean // not sure why was int on native side
  photoQualityBalance?: 'speed' | 'balanced' | 'quality'
  enableBufferCompression?: boolean
  lowLightBoost?: boolean
  videoStabilizationMode?: string
  enableDepthData?: boolean
  enablePortraitEffectsMatteDelivery?: boolean
  enableFpsGraph?: boolean
  outputOrientation?: 'device' | 'preview'
  isMirrored?: boolean
  cameraId: string
  enableFrameProcessor: boolean
  codeScannerOptions?: Readonly<{
    codeTypes?: string[]
    regionOfInterest?: Readonly<{
      x?: Double
      y?: Double
      width?: Double
      height?: Double
    }>
  }>
  minFps?: Double
  maxFps?: Double

  onViewReady: DirectEventHandler<Readonly<{}>>
  onAverageFpsChanged?: DirectEventHandler<Readonly<{ averageFps: Double }>>
  onInitialized?: DirectEventHandler<Readonly<{}>>
  onError?: DirectEventHandler<
    Readonly<{
      code: string
      message: string
      cause?: Readonly<{ code?: Int32; domain?: string; message?: string; details?: string; stacktrace?: string }>
    }>
  >
  onCodeScanned?: DirectEventHandler<
    Readonly<{
      codes?: Readonly<{
        type?: string
        value?: string
        frame?: Readonly<{ x: Double; y: Double; width: Double; height: Double }>
      }>[]
      frame?: Readonly<{ width: Int32; height: Int32 }>
    }>
  >
  onStarted?: DirectEventHandler<Readonly<{}>>
  onStopped?: DirectEventHandler<Readonly<{}>>
  onPreviewStarted?: DirectEventHandler<Readonly<{}>>
  onPreviewStopped?: DirectEventHandler<Readonly<{}>>
  onShutter?: DirectEventHandler<
    Readonly<{
      type: string
    }>
  >
  onOutputOrientationChanged?: DirectEventHandler<
    Readonly<{
      outputOrientation: 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right'
    }>
  >
  onPreviewOrientationChanged?: DirectEventHandler<
    Readonly<{
      previewOrientation: 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right'
    }>
  >
}

export default codegenNativeComponent<NativeProps>('CameraView')
