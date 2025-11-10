import { useEffect, useMemo } from 'react'
import { HybridCameraFactory, HybridWorkletQueueFactory, type Depth } from '..'
import { createWorkletRuntime, scheduleOnRuntime } from 'react-native-worklets'
import { NitroModules } from 'react-native-nitro-modules'
import type { CameraDepthFrameOutput } from '../specs/outputs/CameraDepthFrameOutput.nitro'

interface Props {
  /**
   * @worklet
   */
  onDepth?: (depth: Depth) => void
}

export function useDepthOutput({ onDepth }: Props): CameraDepthFrameOutput {
  const output = useMemo(
    () => HybridCameraFactory.createDepthFrameOutput('native'),
    []
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
    if (onDepth != null) {
      const boxed = NitroModules.box(output)
      scheduleOnRuntime(workletRuntime, () => {
        'worklet'
        const unboxed = boxed.unbox()
        unboxed.setOnDepthFrameCallback((depth) => {
          onDepth(depth)
          return true
        })
      })
    } else {
      output.setOnDepthFrameCallback(undefined)
    }
  }, [onDepth, output, workletRuntime])

  return output
}
