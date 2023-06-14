import { NativeSyntheticEvent, requireNativeComponent } from 'react-native';
import type { ErrorWithCause } from './CameraError';
import type { CameraProps, FrameProcessorPerformanceSuggestion } from './CameraProps';

interface OnErrorEvent {
  code: string;
  message: string;
  cause?: ErrorWithCause;
}

export type CameraNativeComponentProps = Omit<
  CameraProps,
  'device' | 'onInitialized' | 'onError' | 'onFrameProcessorPerformanceSuggestionAvailable' | 'frameProcessor' | 'frameProcessorFps'
> & {
  cameraId: string;
  frameProcessorFps?: number; // native cannot use number | string, so we use '-1' for 'auto'
  enableFrameProcessor: boolean;
  onInitialized?: (event: NativeSyntheticEvent<void>) => void;
  onError?: (event: NativeSyntheticEvent<OnErrorEvent>) => void;
  onFrameProcessorPerformanceSuggestionAvailable?: (event: NativeSyntheticEvent<FrameProcessorPerformanceSuggestion>) => void;
  onViewReady: () => void;
};

const CameraNativeComponent = requireNativeComponent<CameraNativeComponentProps>('CameraNativeComponent');
export default CameraNativeComponent;
