import { useEffect, useMemo } from 'react'
import { HybridCameraFactory, type Depth } from '..'
import type { CameraDepthFrameOutput } from '../specs/outputs/CameraDepthFrameOutput.nitro'
import { useNativeThreadWorkletRuntime } from './useNativeThreadWorkletRuntime'
import { runOnCameraOutputThread } from '../utils/runOnOutputThread'

interface Props {
  /**
   * @worklet
   */
  onDepth?: (depth: Depth) => void
}

export function useDepthOutput({ onDepth }: Props): CameraDepthFrameOutput {
  // 1. Create depth output
  const depthOutput = useMemo(
    () => HybridCameraFactory.createDepthFrameOutput('native'),
    []
  )
  // 2. Create Worklet Runtime for NativeThread
  const workletRuntime = useNativeThreadWorkletRuntime(depthOutput.thread)

  // 3. Update onDepth() callback if it changed
  useEffect(() => {
    if (onDepth != null) {
      runOnCameraOutputThread(depthOutput, workletRuntime, (output) => {
        'worklet'
        output.setOnDepthFrameCallback((depth) => {
          try {
            onDepth(depth)
          } catch (e) {
            console.error(e)
          }
          return true
        })
      })
    } else {
      depthOutput.setOnDepthFrameCallback(undefined)
    }
  }, [onDepth, depthOutput, workletRuntime])

  // 4. Return :)
  return depthOutput
}
