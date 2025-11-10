import { scheduleOnRuntime, type WorkletRuntime } from 'react-native-worklets'
import type { NativeThread } from '../specs/frame-processors/NativeThread.nitro'
import type { CameraOutput } from '../specs/outputs/CameraOutput.nitro'
import { NitroModules } from 'react-native-nitro-modules'

interface OutputWithThread extends CameraOutput {
  readonly thread: NativeThread
}

export function runOnCameraOutputThread<T extends OutputWithThread>(
  output: T,
  runtime: WorkletRuntime,
  worklet: (output: T) => void
) {
  // TODO: Remove this boxing once react-native-worklets supports HybridObject
  const boxed = NitroModules.box(output)
  scheduleOnRuntime(runtime, () => {
    'worklet'
    const unboxed = boxed.unbox()
    worklet(unboxed)
  })
}
