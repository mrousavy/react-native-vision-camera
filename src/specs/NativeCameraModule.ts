import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  takePhoto(
    options?: Readonly<{
      qualityPrioritization?: string;
      flash?: string;
      enableAutoRedEyeReduction?: boolean;
      enableAutoStabilization?: boolean;
      enableAutoDistortionCorrection?: boolean;
      skipMetadata?: boolean;
    }>,
  ): Promise<
    Readonly<{
      path: string;
      width: Double;
      height: Double;
      isRawPhoto: boolean;
    }>
  >;
  takeSnapshot(
    options?: Readonly<{
      quality?: number;
      flash?: string;
      skipMetadata?: boolean;
    }>,
  ): Promise<
    Readonly<{
      path: string;
      width: Double;
      height: Double;
      isRawPhoto: boolean;
    }>
  >;
  startRecording(
    options?: Readonly<{
      flash?: string;
      fileType?: string;
      videoCodec?: string;
    }>,
    onRecordCallback?: (
      video?: Readonly<{
        path: string;
        duration: number;
      }>,
      error?: Readonly<{ code: string; message: string; cause?: string }>,
    ) => void,
  ): void;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  focus(point: Readonly<{ x: Double; y: Double }>): Promise<void>;
  getAvailableVideoCodecs(fileType?: string): Promise<ReadonlyArray<string>>;
  getAvailableCameraDevices(): Promise<
    ReadonlyArray<
      Readonly<{
        id: string;
        devices: ReadonlyArray<string>;
        position: string;
        name: string;
        hasFlash: boolean;
        hasTorch: boolean;
        isMultiCam: boolean;
        minZoom: Double;
        maxZoom: Double;
        neutralZoom: Double;
        formats: ReadonlyArray<
          Readonly<{
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
            frameRateRanges: ReadonlyArray<{
              minFrameRate: Int32;
              maxFrameRate: Int32;
            }>;
            autoFocusSystem: string;
            videoStabilizationModes: string[];
            pixelFormat: string;
          }>
        >;
        supportsParallelVideoProcessing: boolean;
        supportsLowLightBoost: boolean;
        supportsDepthCapture: boolean;
        supportsRawCapture: boolean;
        supportsFocus: boolean;
      }>
    >
  >;
  getCameraPermissionStatus(): Promise<string>;
  getMicrophonePermissionStatus(): Promise<string>;
  requestCameraPermission(): Promise<string>;
  requestMicrophonePermission(): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('CameraModule') as Spec | null;
