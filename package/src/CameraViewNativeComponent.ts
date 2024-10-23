/* eslint-disable @typescript-eslint/ban-types */
import type { HostComponent, ViewProps } from 'react-native'
import type { DirectEventHandler, Double, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

export type VisionCameraComponentType = HostComponent<NativeProps>

export type CodeTypes =
  | 'code-128'
  | 'code-39'
  | 'code-93'
  | 'codabar'
  | 'ean-13'
  | 'ean-8'
  | 'itf'
  | 'upc-e'
  | 'upc-a'
  | 'qr'
  | 'pdf-417'
  | 'aztec'
  | 'data-matrix'
  | 'unknown'

export interface NativeProps extends ViewProps {
  isActive: boolean
  preview?: boolean
  photo?: boolean
  video?: boolean
  audio?: boolean
  pixelFormat?: WithDefault<'yuv' | 'rgb', 'yuv'>
  enableLocation?: boolean
  torch?: WithDefault<'off' | 'on', 'off'>
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
    supportsVideoHdr: boolean
    supportsPhotoHdr: boolean
    supportsDepthCapture: boolean
    minFps: Double
    maxFps: Double
    autoFocusSystem: string
    // TODO: codegen doesn't support nested custom types
    videoStabilizationModes?: string[]
  }>
  resizeMode?: WithDefault<'cover' | 'contain', 'cover'>
  androidPreviewViewType?: WithDefault<'surface-view' | 'texture-view', 'surface-view'>
  videoHdr?: boolean // not sure why was int on native side
  photoHdr?: boolean // not sure why was int on native side
  photoQualityBalance?: WithDefault<'speed' | 'balanced' | 'quality', 'balanced'>
  enableBufferCompression?: boolean
  lowLightBoost?: boolean
  // TODO: is the default really off or is it auto?
  videoStabilizationMode?: WithDefault<'off' | 'standard' | 'cinematic' | 'cinematic-extended' | 'auto', 'off'>
  enableDepthData?: boolean
  enablePortraitEffectsMatteDelivery?: boolean
  outputOrientation?: WithDefault<'device' | 'preview', 'device'>
  isMirrored?: boolean
  cameraId: string
  enableFrameProcessor: boolean
  codeScannerOptions?: Readonly<{
    // TODO: codegen doesn't support nested custom types
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
  onCodeScanned?: DirectEventHandler<{
    codes: {
      type: string
      value?: string
      frame?: Readonly<{ x: Double; y: Double; width: Double; height: Double }>
      corners?: Readonly<{ x: Double; y: Double }[]>
    }[]
    frame: Readonly<{ width: Int32; height: Int32 }[]>
  }>
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
