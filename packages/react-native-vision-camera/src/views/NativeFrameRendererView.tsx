import { getHostComponent } from 'react-native-nitro-modules'
import type {
  FrameRendererView,
  FrameRendererViewMethods,
  FrameRendererViewProps,
} from '../specs/views/FrameRendererView.nitro'

/**
 * The `<NativeFrameRendererView />` component.
 *
 * @see {@linkcode FrameRendererView}
 * @see {@linkcode FrameRendererViewProps}
 * @see {@linkcode FrameRendererViewMethods}
 */
export const NativeFrameRendererView = getHostComponent<
  FrameRendererViewProps,
  FrameRendererViewMethods
>('FrameRendererView', () =>
  require('../../nitrogen/generated/shared/json/FrameRendererViewConfig.json'),
)
