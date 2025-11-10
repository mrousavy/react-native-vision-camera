import { getHostComponent } from 'react-native-nitro-modules'
import {
  type PreviewViewMethods,
  type PreviewViewProps,
} from './specs/views/PreviewView.nitro'

export const NativePreviewView = getHostComponent<
  PreviewViewProps,
  PreviewViewMethods
>('PreviewView', () =>
  require('../nitrogen/generated/shared/json/PreviewViewConfig.json')
)
