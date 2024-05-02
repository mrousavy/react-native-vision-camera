import type { IWorkletContext } from 'react-native-worklets-core'
import { createModuleProxy } from '../dependencies/ModuleProxy'
import { CameraModule } from '../NativeCameraModule'
import type { Frame } from '../types/Frame'
import type { FrameProcessorPlugin, ParameterType } from './initFrameProcessorPlugin'

interface TVisionCameraProxy {
  /**
   * @internal
   */
  setFrameProcessor(viewTag: number, frameProcessor: (frame: Frame) => void): void
  /**
   * @internal
   */
  removeFrameProcessor(viewTag: number): void
  /**
   * @internal
   * @deprecated
   */
  initFrameProcessorPlugin(name: string, options: Record<string, ParameterType>): FrameProcessorPlugin | undefined
  /**
   * Get the Frame Processor Runtime Worklet Context.
   *
   * This is the serial [DispatchQueue](https://developer.apple.com/documentation/dispatch/dispatchqueue)
   * / [Executor](https://developer.android.com/reference/java/util/concurrent/Executor) the
   * video/frame processor pipeline is running on.
   *
   * @internal
   */
  workletContext: IWorkletContext | undefined
}

/**
 * The JSI Proxy for the Frame Processors Runtime.
 *
 * This will be replaced with a CxxTurboModule in the future.
 */
export const VisionCameraProxy = createModuleProxy<TVisionCameraProxy>(() => {
  // 1. Load react-native-worklets-core
  require('react-native-worklets-core')
  // 2. If react-native-worklets-core could be loaded, try to install Frame Processor bindings
  const result = CameraModule.installFrameProcessorBindings() as unknown
  if (result !== true) throw new Error(`Failed to install Frame Processor JSI bindings! installFrameProcessorBindings() returned ${result}`)

  // 3. Get global.VisionCameraProxy which was just installed by installFrameProcessorBindings()
  // @ts-expect-error it's a global JSI variable injected by native
  const globalProxy = global.VisionCameraProxy as TVisionCameraProxy | undefined
  if (globalProxy == null) throw new Error('global.VisionCameraProxy is not installed! Was installFrameProcessorBindings() called?')

  return globalProxy
})
