import { useMemo } from 'react'
import type { FrameRenderer } from '../specs/FrameRenderer.nitro'
import type { Frame } from '../specs/instances/Frame.nitro'
import { VisionCamera } from '../VisionCamera'
import type { NativeFrameRendererView } from '../views/NativeFrameRendererView'

/**
 * Use a {@linkcode FrameRenderer}.
 *
 * A {@linkcode FrameRenderer} allows rendering
 * {@linkcode Frame}s to a
 * {@linkcode NativeFrameRendererView | <NativeFrameRendererView />}.
 *
 * @example
 * ```tsx
 * const frameRenderer = useFrameRenderer()
 * const frameOutput = useFrameOutput({
 *   onFrame(frame) {
 *     'worklet'
 *     frameRenderer.renderFrame(frame)
 *     frame.dispose()
 *   }
 * })
 *
 * return (
 *   <NativeFrameRendererView
 *     style={StyleSheet.absoluteFill}
 *     frameRenderer={frameRenderer}
 *   />
 * )
 * ```
 */
export function useFrameRenderer(): FrameRenderer {
  return useMemo(() => VisionCamera.createFrameRenderer(), [])
}
