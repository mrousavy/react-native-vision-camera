import { useEffect, useMemo } from 'react'
import {
  HybridCameraFactory,
  type CameraFrameOutput,
  type Frame,
  type TargetVideoPixelFormat,
} from '..'
import { useNativeThreadWorkletRuntime } from './useNativeThreadWorkletRuntime'
import { runOnCameraOutputThread } from '../utils/runOnOutputThread'

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
  // 1. Create frame output
  const frameOutput = useMemo(
    () => HybridCameraFactory.createFrameOutput(pixelFormat),
    [pixelFormat]
  )
  // 2. Create Worklet Runtime for NativeThread
  const workletRuntime = useNativeThreadWorkletRuntime(frameOutput.thread)

  // 3. Update onFrame() callback if it changed
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

  // 4. Return :)
  return frameOutput
}
