import type { NativeSyntheticEvent } from 'react-native';
import type { ErrorWithCause } from './CameraError';
import type { CameraProps, OnShutterEvent } from './types/CameraProps';
import type { Code, CodeScanner, CodeScannerFrame } from './types/CodeScanner';
import type { Orientation } from './types/Orientation';
export interface OnCodeScannedEvent {
    codes: Code[];
    frame: CodeScannerFrame;
}
export interface OnErrorEvent {
    code: string;
    message: string;
    cause?: ErrorWithCause;
}
export interface AverageFpsChangedEvent {
    averageFps: number;
}
export interface OutputOrientationChangedEvent {
    outputOrientation: Orientation;
}
export interface PreviewOrientationChangedEvent {
    previewOrientation: Orientation;
}
export type NativeCameraViewProps = Omit<CameraProps, 'device' | 'onInitialized' | 'onError' | 'onShutter' | 'onOutputOrientationChanged' | 'onPreviewOrientationChanged' | 'frameProcessor' | 'codeScanner'> & {
    cameraId: string;
    enableFrameProcessor: boolean;
    codeScannerOptions?: Omit<CodeScanner, 'onCodeScanned'>;
    onViewReady: (event: NativeSyntheticEvent<void>) => void;
    onAverageFpsChanged?: (event: NativeSyntheticEvent<AverageFpsChangedEvent>) => void;
    onInitialized?: (event: NativeSyntheticEvent<void>) => void;
    onError?: (event: NativeSyntheticEvent<OnErrorEvent>) => void;
    onCodeScanned?: (event: NativeSyntheticEvent<OnCodeScannedEvent>) => void;
    onStarted?: (event: NativeSyntheticEvent<void>) => void;
    onStopped?: (event: NativeSyntheticEvent<void>) => void;
    onPreviewStarted?: (event: NativeSyntheticEvent<void>) => void;
    onPreviewStopped?: (event: NativeSyntheticEvent<void>) => void;
    onShutter?: (event: NativeSyntheticEvent<OnShutterEvent>) => void;
    onOutputOrientationChanged?: (event: NativeSyntheticEvent<OutputOrientationChangedEvent>) => void;
    onPreviewOrientationChanged?: (event: NativeSyntheticEvent<PreviewOrientationChangedEvent>) => void;
};
export declare const NativeCameraView: import("react-native").HostComponent<NativeCameraViewProps>;
//# sourceMappingURL=NativeCameraView.d.ts.map