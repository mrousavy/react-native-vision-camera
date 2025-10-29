import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules'
import type { CameraSession } from './CameraSession.nitro'

export interface PreviewViewProps extends HybridViewProps {
  session?: CameraSession
}

export interface PreviewViewMethods extends HybridViewMethods {}

export type PreviewView = HybridView<PreviewViewProps, PreviewViewMethods>
