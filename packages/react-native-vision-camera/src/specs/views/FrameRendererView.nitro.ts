import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules'
import type { NativeFrameRendererView } from '../../views/NativeFrameRendererView'
import type { FrameRenderer } from '../FrameRenderer.nitro'

export interface FrameRendererViewProps extends HybridViewProps {
  renderer?: FrameRenderer
}

export interface FrameRendererViewMethods extends HybridViewMethods {}

/**
 * The {@linkcode FrameRendererView} Hybrid View.
 *
 * A {@linkcode FrameRendererView} can be rendered via the
 * {@linkcode NativeFrameRendererView} component.
 *
 * @see {@linkcode FrameRendererViewProps}
 * @see {@linkcode FrameRendererViewMethods}
 * @see {@linkcode NativeFrameRendererView}
 */
export type FrameRendererView = HybridView<
  FrameRendererViewProps,
  FrameRendererViewMethods
>
