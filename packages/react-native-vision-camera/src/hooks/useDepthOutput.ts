import { useEffect, useMemo, useRef } from 'react'
import type { FrameDroppedReason } from '../specs/common-types/FrameDroppedReason'
import type { Depth } from '../specs/instances/Depth.nitro'
import type {
  CameraDepthFrameOutput,
  DepthFrameOutputOptions,
} from '../specs/outputs/CameraDepthFrameOutput.nitro'
import { VisionCameraWorkletsProxy } from '../third-party/VisionCameraWorkletsProxy'
import { CommonResolutions } from '../utils/CommonResolutions'
import { VisionCamera } from '../VisionCamera'

type BaseDepthOptions = Pick<
  DepthFrameOutputOptions,
  | 'targetResolution'
  | 'allowDeferredStart'
  | 'dropFramesWhileBusy'
  | 'enableFiltering'
>

interface Props extends Partial<BaseDepthOptions> {
  /**
   * @worklet
   */
  onDepth?: (depth: Depth) => void
  onDepthFrameDropped?: (reason: FrameDroppedReason) => void
}

export function useDepthOutput({
  targetResolution = CommonResolutions.VGA_16_9,
  enableFiltering = true,
  onDepth,
  onDepthFrameDropped,
  dropFramesWhileBusy = true,
  allowDeferredStart = true,
}: Props): CameraDepthFrameOutput {
  // 1. Create depth output
  const depthOutput = useMemo(
    () =>
      VisionCamera.createDepthFrameOutput({
        targetResolution: targetResolution,
        enableFiltering: enableFiltering,
        enablePhysicalBufferRotation: false,
        dropFramesWhileBusy: dropFramesWhileBusy,
        allowDeferredStart: allowDeferredStart,
      }),
    [
      targetResolution,
      enableFiltering,
      dropFramesWhileBusy,
      allowDeferredStart,
    ],
  )

  // 2. Add Frame dropped warner
  const onDepthFrameDroppedRef = useRef(onDepthFrameDropped)
  onDepthFrameDroppedRef.current = onDepthFrameDropped
  useEffect(() => {
    depthOutput.setOnDepthFrameDroppedCallback((reason) => {
      const callback = onDepthFrameDroppedRef.current
      if (callback != null) callback(reason)
      else console.warn(`Depth Frame Dropped! Reason: ${reason}`)
    })
  }, [depthOutput])

  // 3. Create Worklet Runtime for NativeThread
  const runtime = useMemo(
    () => VisionCameraWorkletsProxy.createRuntimeForThread(depthOutput.thread),
    [depthOutput.thread],
  )
  // 4. Update onDepth() callback if it changed
  useEffect(() => {
    runtime.setOnDepthFrameCallback(depthOutput, onDepth)
  }, [runtime, depthOutput, onDepth])

  // 5. Return :)
  return depthOutput
}
