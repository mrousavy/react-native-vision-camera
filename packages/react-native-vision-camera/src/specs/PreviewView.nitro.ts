import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules'
import type { CameraPreviewOutput } from './outputs/CameraPreviewOutput.nitro'

export interface PreviewViewProps extends HybridViewProps {
  previewOutput?: CameraPreviewOutput
}

export interface PreviewViewMethods extends HybridViewMethods {}

export type PreviewView = HybridView<PreviewViewProps, PreviewViewMethods>
