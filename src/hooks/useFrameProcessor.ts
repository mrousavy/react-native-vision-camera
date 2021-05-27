import { DependencyList, useCallback } from 'react';
import type { Frame } from 'src/Frame';

type FrameProcessor = (frame: Frame) => void;

/**
 * Returns a memoized Frame Processor function wich you can pass to the `<Camera>`. (See ["Frame Processors"](https://cuvent.github.io/react-native-vision-camera/docs/guides/frame-processors))
 *
 * @param frameProcessor The Frame Processor
 * @param dependencies The React dependencies which will be copied into the VisionCamera JS-Runtime.
 * @returns The memoized Frame Processor.
 * @example
 * ```ts
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet'
 *   const qrCodes = scanQRCodes(frame)
 *   _log(`QR Codes: ${qrCodes}`)
 * }, [])
 * ```
 */
export const useFrameProcessor: (frameProcessor: FrameProcessor, dependencies: DependencyList) => FrameProcessor = useCallback;
