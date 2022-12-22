import { DependencyList, useCallback } from 'react';
import type { Frame } from '../Frame';

type FrameProcessor = (frame: Frame) => void;

// TODO: Use react-native-worklets decorator
const jsConsole = {
  log: Worklets.createRunInJsFn((...args: unknown[]) => {
    'worklet';
    return console.log(...args);
  }),
  warn: Worklets.createRunInJsFn((...args: any[]) => {
    'worklet';
    return console.warn(...args);
  }),
  error: Worklets.createRunInJsFn((...args: any[]) => {
    'worklet';
    return console.error(...args);
  }),
  info: Worklets.createRunInJsFn((...args: any[]) => {
    'worklet';
    return console.info(...args);
  }),
};

/**
 * Returns a memoized Frame Processor function wich you can pass to the `<Camera>`. (See ["Frame Processors"](https://mrousavy.github.io/react-native-vision-camera/docs/guides/frame-processors))
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
export function useFrameProcessor(frameProcessor: FrameProcessor, dependencies: DependencyList): FrameProcessor {
  return useCallback((frame: Frame) => {
    'worklet';

    // @ts-expect-error console is null in this context
    global.console = jsConsole;

    frameProcessor(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
