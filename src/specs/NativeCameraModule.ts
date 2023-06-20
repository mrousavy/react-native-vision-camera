import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  //   readonly getConstants: () => {};

  takePhoto: (
    options?: Readonly<{
      qualityPrioritization?: string;
      flash?: string;
      enableAutoRedEyeReduction?: boolean;
      enableAutoStabilization?: boolean;
      enableAutoDistortionCorrection?: boolean;
      skipMetadata?: boolean;
    }>,
  ) => Promise<
    Readonly<{
      path: string;
      width: Double;
      height: Double;
      isRawPhoto: boolean;
    }>
  >;
  takeSnapshot: (
    options?: Readonly<{
      quality?: number;
      flash?: string;
      skipMetadata?: boolean;
    }>,
  ) => Promise<
    Readonly<{
      path: string;
      width: Double;
      height: Double;
      isRawPhoto: boolean;
    }>
  >;
  startRecording: (
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
  ) => void;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  focus: (point: Readonly<{ x: Double; y: Double }>) => Promise<void>;
  getAvailableVideoCodecs: (fileType?: string) => Promise<ReadonlyArray<string>>;
  getAvailableCameraDevices: () => Promise<ReadonlyArray<string>>;
  getCameraPermissionStatus: () => Promise<string>;
  getMicrophonePermissionStatus: () => Promise<string>;
  requestCameraPermission: () => Promise<string>;
  requestMicrophonePermission: () => Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CameraModule');
