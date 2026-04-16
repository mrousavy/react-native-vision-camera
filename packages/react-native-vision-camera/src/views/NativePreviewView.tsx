import { getHostComponent } from 'react-native-nitro-modules'
import type { CameraPreviewOutput } from '../specs/outputs/CameraPreviewOutput.nitro'
import type { CameraSession } from '../specs/session/CameraSession.nitro'
import type {
  PreviewView,
  PreviewViewMethods,
  PreviewViewProps,
} from '../specs/views/PreviewView.nitro'
import type { Camera } from './Camera'

/**
 * The `<NativePreviewView />` component.
 *
 * The higher-level {@linkcode Camera} component
 * renders this native component under the hood.
 *
 * The `<NativePreviewView />` requires a {@linkcode CameraPreviewOutput}
 * that is also connected to a {@linkcode CameraSession} to
 * display a live Camera feed.
 *
 * @see {@linkcode PreviewView}
 * @see {@linkcode PreviewViewProps}
 * @see {@linkcode PreviewViewMethods}
 * @example
 * ```tsx
 * function App() {
 *   const previewView = useRef<PreviewView>(null)
 *   const previewOutput = usePreviewOutput()
 *
 *   return (
 *     <NativePreviewView
 *       style={StyleSheet.absoluteFill}
 *       previewOutput={previewOutput}
 *       hybridRef={callback((r) => {
 *         previewView.current = r
 *       })}
 *     />
 *   )
 * }
 * ```
 */
export const NativePreviewView = getHostComponent<
  PreviewViewProps,
  PreviewViewMethods
>('PreviewView', () =>
  require('../../nitrogen/generated/shared/json/PreviewViewConfig.json'),
)
