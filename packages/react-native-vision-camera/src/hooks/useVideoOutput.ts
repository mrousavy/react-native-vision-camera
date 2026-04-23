import { useMemo } from 'react'
import {
  type CameraVideoOutput,
  CommonResolutions,
  type VideoOutputOptions,
} from '..'
import { VisionCamera } from '../VisionCamera'

/**
 * Use a {@linkcode CameraVideoOutput} for recording videos.
 *
 * The returned {@linkcode CameraVideoOutput} can be passed to a
 * {@linkcode Camera} to enable video recording. Recordings are started and
 * stopped via the {@linkcode CameraVideoOutput.startRecording | startRecording()}
 * and {@linkcode CameraVideoOutput.stopRecording | stopRecording()} methods.
 *
 * @example
 * ```ts
 * const videoOutput = useVideoOutput({
 *   targetResolution: CommonResolutions.FHD_16_9,
 *   enableAudio: true,
 * })
 *
 * // ...
 * await videoOutput.startRecording()
 * // later...
 * const video = await videoOutput.stopRecording()
 * ```
 */
export function useVideoOutput({
  targetResolution = CommonResolutions.FHD_16_9,
  targetBitRate,
  enablePersistentRecorder,
  enableAudio,
  fileType,
}: Partial<VideoOutputOptions> = {}): CameraVideoOutput {
  const videoOutput = useMemo(
    () =>
      VisionCamera.createVideoOutput({
        targetResolution: targetResolution,
        targetBitRate: targetBitRate,
        enablePersistentRecorder: enablePersistentRecorder,
        enableAudio: enableAudio,
        fileType: fileType,
      }),
    [
      enablePersistentRecorder,
      targetBitRate,
      enableAudio,
      targetResolution,
      fileType,
    ],
  )

  return videoOutput
}
