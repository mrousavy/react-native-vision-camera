import { useEffect, useMemo } from 'react'
import {
  HybridCameraFactory,
  HybridWorkletQueueFactory,
  type CameraFrameOutput,
  type Frame,
  type TargetVideoPixelFormat,
} from '..'
import { createWorkletRuntime, scheduleOnRuntime } from 'react-native-worklets'
import { NitroModules } from 'react-native-nitro-modules'

interface Props {
  pixelFormat?: TargetVideoPixelFormat
  /**
   * @worklet
   */
  onFrame?: (frame: Frame) => void
}

export function useFrameOutput({
  pixelFormat = 'native',
  onFrame,
}: Props): CameraFrameOutput {
  const output = useMemo(
    () => HybridCameraFactory.createFrameOutput(pixelFormat),
    [pixelFormat]
  )
  const workletRuntime = useMemo(() => {
    const workletQueue = HybridWorkletQueueFactory.wrapThreadInQueue(
      output.thread
    )
    return createWorkletRuntime({
      name: `com.margelo.camera.frame`,
      customQueue: workletQueue,
      useDefaultQueue: false,
    })
  }, [output])

  useEffect(() => {
    if (onFrame != null) {
      const boxed = NitroModules.box(output)
      scheduleOnRuntime(workletRuntime, () => {
        'worklet'
        const unboxed = boxed.unbox()
        unboxed.setOnFrameCallback((frame) => {
          onFrame(frame)
          return true
        })
      })
    } else {
      output.setOnFrameCallback(undefined)
    }
  }, [onFrame, output, workletRuntime])

  return output
}
