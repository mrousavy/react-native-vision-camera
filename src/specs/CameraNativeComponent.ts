import type { HostComponent, ViewProps } from 'react-native';
import type { DirectEventHandler, Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ErrorWithCause } from '../CameraError';
import type React from 'react';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';

type VisionCameraComponentType = HostComponent<NativeProps>;

// Create an interface whith commands that your component accepts
interface NativeCommands {
  takePhoto: (
    viewRef: React.ElementRef<VisionCameraComponentType>,
    options?: string, // TODO: FOR NOW I PUT THIS AS STRING SINCE I DON'T THINK CODEGEN SUPPORTS MAPS AS ARGUMENTS
  ) => void;
  takeSnapshot: (
    viewRef: React.ElementRef<VisionCameraComponentType>,
    options?: string, // TODO: FOR NOW I PUT THIS AS STRING SINCE I DON'T THINK CODEGEN SUPPORTS MAPS AS ARGUMENTS
  ) => void;
  startRecording: (
    viewRef: React.ElementRef<VisionCameraComponentType>,
    options?: string, // TODO: FOR NOW I PUT THIS AS STRING SINCE I DON'T THINK CODEGEN SUPPORTS MAPS AS ARGUMENTS
  ) => void;
  pauseRecording: (viewRef: React.ElementRef<VisionCameraComponentType>) => void;
  resumeRecording: (viewRef: React.ElementRef<VisionCameraComponentType>) => void;
  stopRecording: (viewRef: React.ElementRef<VisionCameraComponentType>) => void;
  focus: (viewRef: React.ElementRef<VisionCameraComponentType>, x?: Double, y?: Double) => void;
  getAvailableVideoCodecs: (viewRef: React.ElementRef<VisionCameraComponentType>, fileType?: string) => string;
}

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

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'takePhoto',
    'focus',
    'getAvailableVideoCodecs',
    'pauseRecording',
    'resumeRecording',
    'startRecording',
    'stopRecording',
    'takeSnapshot',
  ],
});

export default codegenNativeComponent<NativeProps>('CameraView');
