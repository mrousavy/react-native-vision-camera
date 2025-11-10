import { useEffect, useMemo, useRef } from 'react'
import { HybridCameraFactory, type Depth } from '..'
import type { CameraDepthFrameOutput } from '../specs/outputs/CameraDepthFrameOutput.nitro'
import { useNativeThreadWorkletRuntime } from './useNativeThreadWorkletRuntime'
import { runOnCameraOutputThread } from '../utils/runOnOutputThread'
import type { FrameDroppedReason } from '../specs/common-types/FrameDroppedReason'

interface Props {
  /**
   * @worklet
   */
  onDepth?: (depth: Depth) => void
  onDepthFrameDropped?: (reason: FrameDroppedReason) => void
}

export function useDepthOutput({
  onDepth,
  onDepthFrameDropped,
}: Props): CameraDepthFrameOutput {
  // 1. Create depth output
  const depthOutput = useMemo(
    () => HybridCameraFactory.createDepthFrameOutput('native'),
    []
  )
  // 2. Create Worklet Runtime for NativeThread
  const workletRuntime = useNativeThreadWorkletRuntime(depthOutput.thread)

  // 3. Add Frame dropped warner
  const onDepthFrameDroppedRef = useRef(onDepthFrameDropped)
  onDepthFrameDroppedRef.current = onDepthFrameDropped
  useEffect(() => {
    depthOutput.setOnDepthFrameDroppedCallback((reason) => {
      const callback = onDepthFrameDroppedRef.current
      if (callback != null) callback(reason)
      else console.warn(`Depth Frame Dropped! Reason: ${reason}`)
    })
  }, [depthOutput])

  // 4. Update onDepth() callback if it changed
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

  // 5. Return :)
  return depthOutput
}
