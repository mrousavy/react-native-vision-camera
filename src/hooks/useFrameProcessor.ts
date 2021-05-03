import { DependencyList, useCallback } from 'react';
import type { Frame } from 'src/Frame';

/**
 * Returns a memoized Frame Processor function wich you can pass to the `<Camera>`. (See ["Frame Processors"](https://cuvent.github.io/react-native-vision-camera/docs/guides/frame-processors))
 *
 * > If you are using the [react-hooks ESLint plugin](https://www.npmjs.com/package/eslint-plugin-react-hooks), make sure to add `useFrameProcessor` to `additionalHooks` inside your ESLint config. (See ["advanced configuration"](https://www.npmjs.com/package/eslint-plugin-react-hooks#advanced-configuration))
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
export function useFrameProcessor(frameProcessor: (frame: Frame) => void, dependencies: DependencyList): (frame: Frame) => void {
  return useCallback((frame: Frame) => {
    'worklet';
    return frameProcessor(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
