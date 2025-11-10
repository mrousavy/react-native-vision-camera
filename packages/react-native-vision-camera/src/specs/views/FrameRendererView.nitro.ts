import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules'
import type { FrameRenderer } from '../FrameRenderer.nitro'

export interface FrameRendererViewProps extends HybridViewProps {
  renderer?: FrameRenderer
}

export interface FrameRendererViewMethods extends HybridViewMethods {}

export type FrameRendererView = HybridView<
  FrameRendererViewProps,
  FrameRendererViewMethods
>
