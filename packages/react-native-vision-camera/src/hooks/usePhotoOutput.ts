import { useMemo } from 'react'
import type {
  CameraPhotoOutput,
  PhotoOutputOptions,
} from '../specs/outputs/CameraPhotoOutput.nitro'
import { CommonResolutions } from '../utils/CommonResolutions'
import { VisionCamera } from '../VisionCamera'

/**
 * Use a {@linkcode CameraPhotoOutput} for capturing {@linkcode Photo}s.
 *
 * The returned {@linkcode CameraPhotoOutput} can be passed to a
 * {@linkcode Camera} to enable photo capture. Photos can then be captured
 * via {@linkcode CameraPhotoOutput.capture | capture()}.
 *
 * @example
 * ```ts
 * const photoOutput = usePhotoOutput({
 *   targetResolution: CommonResolutions.UHD_4_3,
 *   qualityPrioritization: 'quality',
 * })
 *
 * // ...
 * const photo = await photoOutput.capture({ flash: 'auto' })
 * ```
 */
export function usePhotoOutput({
  targetResolution = CommonResolutions.UHD_4_3,
  containerFormat = 'native',
  quality = 0.9,
  qualityPrioritization = 'balanced',
  previewImageTargetSize = undefined,
}: Partial<PhotoOutputOptions> = {}): CameraPhotoOutput {
  // 1. Create photo output
  const photoOutput = useMemo(
    () =>
      VisionCamera.createPhotoOutput({
        targetResolution: targetResolution,
        containerFormat: containerFormat,
        quality: quality,
        qualityPrioritization: qualityPrioritization,
        previewImageTargetSize: previewImageTargetSize,
      }),
    [
      targetResolution,
      containerFormat,
      quality,
      qualityPrioritization,
      previewImageTargetSize,
    ],
  )

  return photoOutput
}
