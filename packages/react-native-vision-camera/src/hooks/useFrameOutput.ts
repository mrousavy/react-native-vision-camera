import { useEffect, useMemo, useRef } from 'react'
import {
  HybridCameraFactory,
  type CameraFrameOutput,
  type Frame,
  type TargetVideoPixelFormat,
} from '..'
import { useNativeThreadWorkletRuntime } from './useNativeThreadWorkletRuntime'
import { runOnCameraOutputThread } from '../utils/runOnOutputThread'
import type { FrameDroppedReason } from '../specs/common-types/FrameDroppedReason'

interface Props {
  pixelFormat?: TargetVideoPixelFormat
  /**
   * @worklet
   */
  onFrame?: (frame: Frame) => void
  onFrameDropped?: (reason: FrameDroppedReason) => void
}

export function useFrameOutput({
  pixelFormat = 'native',
  onFrame,
  onFrameDropped,
}: Props): CameraFrameOutput {
  // 1. Create frame output
  const frameOutput = useMemo(
    () => HybridCameraFactory.createFrameOutput(pixelFormat),
    [pixelFormat]
  )
  // 2. Create Worklet Runtime for NativeThread
  const workletRuntime = useNativeThreadWorkletRuntime(frameOutput.thread)

  // 3. Add Frame dropped warner
  const onFrameDroppedRef = useRef(onFrameDropped)
  onFrameDroppedRef.current = onFrameDropped
  useEffect(() => {
    frameOutput.setOnFrameDroppedCallback((reason) => {
      const callback = onFrameDroppedRef.current
      if (callback != null) callback(reason)
      else console.warn(`Frame Dropped! Reason: ${reason}`)
    })
  }, [frameOutput])

  // 4. Update onFrame() callback if it changed
  useEffect(() => {
    if (onFrame != null) {
      runOnCameraOutputThread(frameOutput, workletRuntime, (output) => {
        'worklet'
        output.setOnFrameCallback((frame) => {
          try {
            onFrame(frame)
          } catch (e) {
            console.error(e)
          }
          return true
        })
      })
    } else {
      frameOutput.setOnFrameCallback(undefined)
    }
  }, [frameOutput, onFrame, workletRuntime])

  // 5. Return :)
  return frameOutput
}
