import { getHostComponent } from 'react-native-nitro-modules'
import type {
  FrameRendererViewMethods,
  FrameRendererViewProps,
} from './specs/views/FrameRendererView.nitro'

export const NativeFrameRendererView = getHostComponent<
  FrameRendererViewProps,
  FrameRendererViewMethods
>('FrameRendererView', () =>
  require('../nitrogen/generated/shared/json/FrameRendererViewConfig.json')
)
