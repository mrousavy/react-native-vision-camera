import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules'
import type { Frame } from '../instances/Frame.nitro'

export interface FrameRendererViewProps extends HybridViewProps {}

export interface FrameRendererViewMethods extends HybridViewMethods {
  renderFrame(frame: Frame): void
}

export type FrameRendererView = HybridView<
  FrameRendererViewProps,
  FrameRendererViewMethods
>
