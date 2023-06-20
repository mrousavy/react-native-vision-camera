import type { HostComponent, ViewProps } from 'react-native';
import type { DirectEventHandler, Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export type VisionCameraComponentType = HostComponent<NativeProps>;

export interface NativeProps extends ViewProps {
  cameraId: string;
  frameProcessorFps?: Double; // native cannot use number | string, so we use '-1' for 'auto'
  enableFrameProcessor: boolean;
  isActive: boolean;
  photo?: boolean;
  video?: boolean;
  audio?: boolean;
  torch?: string;
  zoom?: Double;
  enableZoomGesture?: boolean;
  preset?: string;
  format?: Readonly<{
    photoHeight: Double;
    photoWidth: Double;
    videoHeight: Double;
    videoWidth: Double;
    isHighestPhotoQualitySupported?: boolean;
    maxISO: Double;
    minISO: Double;
    fieldOfView: Double;
    maxZoom: Double;
    colorSpaces: string[];
    supportsVideoHDR: boolean;
    supportsPhotoHDR: boolean;
    // frameRateRanges: ReadonlyArray<{
    //   minFrameRate: number;
    //   maxFrameRate: number;
    // }>;
    autoFocusSystem: string;
    videoStabilizationModes: string[];
    pixelFormat: string;
  }>;
  fps?: Int32;
  hdr?: boolean;
  lowLightBoost?: boolean;
  colorSpace?: string;
  videoStabilizationMode?: string;
  enableDepthData?: boolean;
  enablePortraitEffectsMatteDelivery?: boolean;
  enableHighQualityPhotos?: boolean;
  orientation?: string;
  onInitialized?: DirectEventHandler<Readonly<{}>>;
  onError?: DirectEventHandler<Readonly<{}>>;
  onViewReady: DirectEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<NativeProps>('CameraView');
