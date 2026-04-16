import { useMemo } from 'react'
import type { CameraPreviewOutput } from '..'
import { VisionCamera } from '../VisionCamera'

export function usePreviewOutput(): CameraPreviewOutput {
  return useMemo(() => VisionCamera.createPreviewOutput(), [])
}
