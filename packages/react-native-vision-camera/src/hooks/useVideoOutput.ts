import { useMemo } from 'react'
import {
  type CameraVideoOutput,
  CommonResolutions,
  type VideoOutputOptions,
} from '..'
import { VisionCamera } from '../VisionCamera'

export function useVideoOutput({
  targetResolution = CommonResolutions.FHD_16_9,
  targetBitRate,
  enablePersistentRecorder,
  enableAudio,
}: Partial<VideoOutputOptions> = {}): CameraVideoOutput {
  const videoOutput = useMemo(
    () =>
      VisionCamera.createVideoOutput({
        targetResolution: targetResolution,
        targetBitRate: targetBitRate,
        enablePersistentRecorder: enablePersistentRecorder,
        enableAudio: enableAudio,
      }),
    [enablePersistentRecorder, targetBitRate, enableAudio, targetResolution],
  )

  return videoOutput
}
