import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules'
import type { CameraSessionPreviewOutput } from './outputs/CameraSessionPreviewOutput.nitro'

export interface PreviewViewProps extends HybridViewProps {
  previewOutput?: CameraSessionPreviewOutput
}

export interface PreviewViewMethods extends HybridViewMethods {}

export type PreviewView = HybridView<PreviewViewProps, PreviewViewMethods>
