import { DependencyList, useMemo } from 'react';
import type { DrawableFrame, Frame, FrameInternal } from '../Frame';
import { FrameProcessor } from '../CameraProps';
// Install RN Worklets by importing it
import 'react-native-worklets/src';

export function createFrameProcessor(frameProcessor: FrameProcessor['frameProcessor'], type: FrameProcessor['type']): FrameProcessor {
  return {
    frameProcessor: (frame: Frame | DrawableFrame) => {
      'worklet';
      // Increment ref-count by one
      (frame as FrameInternal).incrementRefCount();
      try {
        // Call sync frame processor
        // @ts-expect-error the frame type is ambiguous here
        frameProcessor(frame);
      } finally {
        // Potentially delete Frame if we were the last ref (no runAsync)
        (frame as FrameInternal).decrementRefCount();
      }
    },
    type: type,
  };
}

/**
 * Returns a memoized Frame Processor function wich you can pass to the `<Camera>`.
 * (See ["Frame Processors"](https://mrousavy.github.io/react-native-vision-camera/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * @param frameProcessor The Frame Processor
 * @param dependencies The React dependencies which will be copied into the VisionCamera JS-Runtime.
 * @returns The memoized Frame Processor.
 * @example
 * ```ts
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet'
 *   const qrCodes = scanQRCodes(frame)
 *   console.log(`QR Codes: ${qrCodes}`)
 * }, [])
 * ```
 */
export function useFrameProcessor(frameProcessor: (frame: Frame) => void, dependencies: DependencyList): FrameProcessor {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => createFrameProcessor(frameProcessor, 'frame-processor'), dependencies);
}

/**
 * Returns a memoized Skia Frame Processor function wich you can pass to the `<Camera>`.
 * The Skia Frame Processor allows you to draw anything onto the Frame using react-native-skia.
 * (See ["Frame Processors"](https://mrousavy.github.io/react-native-vision-camera/docs/guides/frame-processors))
 *
 * Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.
 *
 * @param frameProcessor The Frame Processor
 * @param dependencies The React dependencies which will be copied into the VisionCamera JS-Runtime.
 * @returns The memoized Frame Processor.
 * @example
 * ```ts
 * const frameProcessor = useSkiaFrameProcessor((frame) => {
 *   'worklet'
 *   const qrCodes = scanQRCodes(frame)
 *   frame.drawRect(...)
 *   console.log(`QR Codes: ${qrCodes}`)
 * }, [])
 * ```
 */
export function useSkiaFrameProcessor(frameProcessor: (frame: DrawableFrame) => void, dependencies: DependencyList): FrameProcessor {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => createFrameProcessor(frameProcessor, 'skia-frame-processor'), dependencies);
}
